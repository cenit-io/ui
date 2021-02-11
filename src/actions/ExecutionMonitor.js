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
    resultSkeleton: {
        margin: theme.spacing(1, 0)
    },
    attachment: {
        marginTop: theme.spacing(1)
    },
    refreshing: {
        margin: theme.spacing(2, 0)
    }
}));

const Delays = [1, 3, 5, 8, 13];

export function ExecutionMonitor({ value, mainIcon }) {

    const [state, setState] = useSpreadState({
        execution: value,
        delayIndex: 0,
        refreshKey: Random.string()
    });

    const theme = useTheme();
    const classes = useStyles();

    const {
        executionDataType, notificationDataType, delayIndex,
        execution, refreshKey, resultData, retrievingResult, refreshing
    } = state;

    const { status, task, attachment } = execution;

    useEffect(() => {
        const subscription = zzip(
            DataType.find({
                namespace: 'Setup',
                name: 'Execution'
            }),
            DataType.find({
                namespace: 'Setup',
                name: 'SystemNotification'
            })
        ).subscribe(([executionDataType, notificationDataType]) => setState({
            executionDataType,
            notificationDataType
        }));

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (executionDataType && refreshKey) {
            const subscription = of(true).pipe(
                delay(1000 * (Delays[delayIndex] || 0)),
                tap(() => setState({ refreshing: true })),
                switchMap(() => executionDataType.get(execution.id, {
                    include_blanks: false,
                    viewport: '{' +
                        'id attachment status started_at completed_at ' +
                        'task {progress description} notifications {id type message}' +
                        '}'
                }))
            ).subscribe(remoteExecution => {
                const nextDelay = AliveStatuses.includes(remoteExecution?.status) && delayIndex < Delays.length - 1
                    ? delayIndex + 1
                    : delayIndex;
                setState(({ execution }) => ({
                    execution: remoteExecution || execution,
                    delayIndex: nextDelay,
                    refreshKey: nextDelay === delayIndex ? null : refreshKey,
                    refreshing: false
                }));
            });

            return () => subscription.unsubscribe();
        }

    }, [executionDataType, refreshKey, delayIndex]);

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

    if (!executionDataType) {
        return <LinearProgress/>;
    }

    const statusAlert = TaskStatusConfig[execution?.status] || TaskStatusConfig.default;

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

    let error;
    if (status === 'failed') {
        const notification = (execution.notifications || []).find(({ type }) => type === 'error');
        if (notification) {
            error = (
                <Typography component="div"
                            variant="subtitle2"
                            className={clsx(classes.result, classes.error, 'flex column')}>
                    {notification.message}
                    <div>
                        <IconButton size="small"
                                    onClick={() => TabsSubject.next(
                                        RecordSubject.for(notificationDataType.id, notification.id).key
                                    )}>
                            <OpenIcon className={classes.error}/>
                        </IconButton>
                    </div>
                </Typography>
            );
        }
    }

    const openExecution = () => TabsSubject.next(
        RecordSubject.for(executionDataType.id, execution.id).key
    );

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
            <div className="flex column align-items-center">
                <TaskStatusViewer value={status} item={execution}/>
                {refresh}
                {result}
                {error}
            </div>
        </Alert>
    );
}
