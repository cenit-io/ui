import { useSpreadState } from "../common/hooks";
import React, { useEffect } from "react";
import { delay, switchMap, tap } from "rxjs/operators";
import Random from "../util/Random";
import Alert from "./Alert";
import { makeStyles, useTheme } from "@material-ui/core";
import { of } from "rxjs";
import AttachmentViewer from "../viewers/AttachmentViewer";
import Typography from "@material-ui/core/Typography";
import AuthorizationService from "../services/AuthorizationService";
import { DataType, isSimpleSchema } from "../services/DataTypeService";
import { TaskStatusConfig, TaskStatusViewer } from "../config/dataTypes/Setup/Task";
import Skeleton from "@material-ui/lab/Skeleton";
import clsx from "clsx";
import IconButton from "@material-ui/core/IconButton";
import OpenIcon from "@material-ui/icons/OpenInNew";
import { RecordSubject, TabsSubject } from "../services/subjects";
import zzip from "../util/zzip";
import RefreshIcon from "@material-ui/icons/Refresh";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";

const AliveStatuses = ['pending', 'running', 'retrying', 'paused'];

const useStyles = makeStyles(theme => ({
    result: {
        marginTop: theme.spacing(1),
        padding: theme.spacing(1),
        background: theme.palette.background.paper
    },
    error: {
        color: theme.palette.error.main
    },
    warning: {
        color: theme.palette.warning.main
    },
    resultSkeleton: {
        margin: theme.spacing(1, 0)
    },
    attachment: {
        marginTop: theme.spacing(1)
    },
    refreshing: {
        margin: theme.spacing(2, 0)
    },
    progress: {
        width: '100%',
        padding: theme.spacing(1, 0)
    }
}));

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
    const classes = useStyles();

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
                const subscription = AuthorizationService.request({
                    url: attachment.url,
                    method: 'GET'
                }).subscribe(
                    resultData => setState({ resultData, retrievingResult: false })
                );

                return () => subscription.unsubscribe();
            }
        }
    }, [attachment]);

    if (!taskDataType) {
        return <LinearProgress/>;
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
            data = <Skeleton variant="rect"
                             width={theme.spacing(attachment.size)}
                             height={theme.spacing(3)}
                             className={classes.resultSkeleton}/>;
        } else if (resultData) {
            data = (
                <Typography component="pre"
                            variant="h6"
                            className={classes.result}>
                    {resultData}
                </Typography>
            );
        }
        result = (
            <>
                {data}
                <AttachmentViewer value={attachment} className={classes.attachment}/>
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
                                className={clsx(classes.result, classes[notificationType], 'flex column')}>
                        {notification.message}
                        <div>
                            <IconButton size="small"
                                        onClick={() => TabsSubject.next({
                                            key: RecordSubject.for(notificationDataType.id, notification.id).key
                                        })}>
                                <OpenIcon className={classes[notificationType]}/>
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
        refresh = <CircularProgress size={theme.spacing(3)} className={classes.refreshing}/>;
    } else if (AliveStatuses.includes(status) && delayIndex > 3) {
        const handleRefresh = () => setState({
            refreshKey: Random.string(),
            delayIndex: Delays.length

        });
        refresh = (
            <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon/>
            </IconButton>
        );
    }
    const title = (
        <div className="text-align-center">
            {task.description}
            <IconButton onClick={openExecution}>
                <OpenIcon/>
            </IconButton>
        </div>
    );

    return (
        <Alert {...statusAlert}
               title={title}>
            <div className="flex column align-items-center full-width">
                <TaskStatusViewer value={status} item={task}/>
                <div className={classes.progress}>
                    <Typography component="div" variant="caption">
                        {task.progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={task.progress} className="grow-1"/>
                </div>
                {refresh}
                {result}
                {notifications}
            </div>
        </Alert>
    );
}
