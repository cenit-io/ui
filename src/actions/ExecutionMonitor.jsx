import { useSpreadState } from "../common/hooks";
import React, { useEffect } from "react";
import { delay, switchMap, tap } from "rxjs/operators";
import Random from "../util/Random";
import Alert from "./Alert";
import { useTheme } from "@mui/material";
import { of } from "rxjs";
import AttachmentViewer from "../viewers/AttachmentViewer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DataType, isSimpleSchema } from "../services/DataTypeService";
import { TaskStatusConfig, TaskStatusViewer } from "../config/dataTypes/Setup/Task";
import Skeleton from '@mui/material/Skeleton';
import IconButton from "@mui/material/IconButton";
import OpenIcon from "@mui/icons-material/OpenInNew";
import { RecordSubject, TabsSubject } from "../services/subject";
import zzip from "../util/zzip";
import request from "../util/request";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";

const AliveStatuses = ['pending', 'running', 'retrying', 'paused'];

const Delays = [1, 3, 5, 8, 13];

const StatusNotifications = {
  failed: 'error',
  paused: 'warning'
};

export function ExecutionMonitor({ dataType, value, mainIcon }) {

  const [state, setState] = useSpreadState({
    task: value.task,
    execution: value,
    delayIndex: 0,
    taskProgress: 0,
    refreshKey: Random.string()
  });

  const theme = useTheme();

  const {
    task, taskDataType, notificationDataType, delayIndex, taskProgress,
    execution, refreshKey, resultData, retrievingResult, refreshing
  } = state;

  const { status } = task;
  const { attachment } = execution;

  useEffect(() => {
    const subscription = zzip(
      dataType.findByName(value.task._type),
      DataType.find({
        namespace: 'Setup',
        name: 'SystemNotification'
      })
    ).subscribe(([taskDataType, notificationDataType]) => setState({
      taskDataType,
      notificationDataType
    }));

    return () => subscription.unsubscribe();
  }, [value, dataType]);

  useEffect(() => {
    if (taskDataType && refreshKey && taskProgress < 100) {
      const subscription = of(true).pipe(
        delay(1000 * (Delays[delayIndex] || 0)),
        tap(() => setState({ refreshing: true })),
        switchMap(() => taskDataType.get(task.id, {
          include_blanks: false,
          viewport: '{id status progress description current_execution {' +
            'attachment status notifications {id type message}' +
            '}'
        }))
      ).subscribe(remoteTask => {
        setState(({ task, taskProgress }) => {
          const currentProgress = remoteTask?.progress || taskProgress;
          if (currentProgress > taskProgress) {
            return {
              taskProgress: currentProgress,
              task: remoteTask,
              execution: remoteTask.current_execution || {},
              delayIndex: 2,
              refreshing: false
            };
          }
          const nextDelay = AliveStatuses.includes(remoteTask?.status) && delayIndex < Delays.length - 1
            ? delayIndex + 1
            : delayIndex;
          return {
            taskProgress: currentProgress,
            task: remoteTask || task,
            execution: remoteTask?.current_execution || {},
            delayIndex: nextDelay,
            refreshKey: nextDelay === delayIndex ? null : refreshKey,
            refreshing: false
          };
        });
      });

      return () => subscription.unsubscribe();
    }

  }, [taskDataType, refreshKey, delayIndex, taskProgress]);

  useEffect(() => {
    if (attachment) {
      const { url, size, metadata } = attachment;
      if (url && size && size < 30 && isSimpleSchema(metadata?.schema)) {
        setState({ retrievingResult: true });
        const subscription = request({
          url: attachment.url,
          method: 'GET'
        }).subscribe(
          ({ data }) => setState({ resultData: data, retrievingResult: false })
        );

        return () => subscription.unsubscribe();
      }
    }
  }, [attachment]);

  if (!taskDataType) {
    return <LinearProgress />;
  }

  const statusAlert = TaskStatusConfig[status] || TaskStatusConfig.default;

  Object.keys(statusAlert).forEach(key => {
    const value = statusAlert[key];
    if (typeof value === 'function') {
      statusAlert[key] = value(theme);
    }
  });

  Object.keys(TaskStatusConfig.default).forEach(key => {
    let value = statusAlert[key];
    if (!value) {
      value = TaskStatusConfig.default[key];
      if (typeof value === 'function') {
        value = value(theme);
      }
      statusAlert[key] = value;
    }
  });

  let result;
  if (attachment) {
    let data;
    if (retrievingResult) {
      data = <Skeleton variant="rectangular"
        width={theme.spacing(attachment.size)}
        height={theme.spacing(3)}
        sx={{ my: 1 }} />;
    } else if (resultData) {
      data = (
        <Typography component="pre"
          variant="h6"
          sx={{
            mt: 1,
            p: 1,
            background: theme => theme.palette.background.paper
          }}>
          {resultData}
        </Typography>
      );
    }
    result = (
      <>
        {data}
        <Box sx={{ mt: 1 }}>
          <AttachmentViewer value={attachment} />
        </Box>
      </>
    );
  }

  let notifications;
  Object.keys(StatusNotifications).forEach(key => {
    if (status === key) {
      const notificationType = StatusNotifications[key];
      const notification = (execution.notifications || []).find(({ type }) => type === notificationType);
      if (notification) {
        notifications = (
          <Typography component="div"
            variant="subtitle2"
            className="flex column"
            sx={{
              mt: 1,
              p: 1,
              background: theme => theme.palette.background.paper,
              color: theme => theme.palette[notificationType].main
            }}>
            {notification.message}
            <div>
              <IconButton size="small"
                onClick={() => TabsSubject.next({
                  key: RecordSubject.for(notificationDataType.id, notification.id).key
                })}>
                <OpenIcon sx={{ color: theme => theme.palette[notificationType].main }} />
              </IconButton>
            </div>
          </Typography>
        );
      }
    }
  });

  const openExecution = () => TabsSubject.next({
    key: RecordSubject.for(taskDataType.id, task.id).key
  });

  let refresh;
  if (refreshing) {
    refresh = <CircularProgress size={theme.spacing(3)} sx={{ my: 2 }} />;
  } else if (AliveStatuses.includes(status) && delayIndex > 3) {
    const handleRefresh = () => setState({
      refreshKey: Random.string(),
      delayIndex: Delays.length

    });
    refresh = (
      <IconButton onClick={handleRefresh} color="primary" size="large">
        <RefreshIcon />
      </IconButton>
    );
  }
  const title = (
    <div className="text-align-center">
      {task.description}
      <IconButton onClick={openExecution} size="large">
        <OpenIcon />
      </IconButton>
    </div>
  );

  return (
    <Alert {...statusAlert}
      title={title}>
      <div className="flex column align-items-center full-width">
        <TaskStatusViewer value={status} item={task} />
        <Box sx={{ width: '100%', py: 1 }}>
          <Typography component="div" variant="caption">
            {task.progress}%
          </Typography>
          <LinearProgress variant="determinate" value={task.progress} className="grow-1" />
        </Box>
        {refresh}
        {result}
        {notifications}
      </div>
    </Alert>
  );
}
