import React, { useCallback, useEffect, useReducer, useState } from 'react';
import ResponsiveContainer from "./ResponsiveContainer";
import { useDropzone } from "react-dropzone";
import '../common/FlexBox.css';
import {
    Typography,
    withStyles,
    List,
    ListItem,
    ListItemText,
    IconButton,
    LinearProgress, ListItemSecondaryAction
} from "@material-ui/core";
import UploadIcon from "@material-ui/icons/CloudUpload";
import ScheduleIcon from "@material-ui/icons/Schedule";
import CancelIcon from "@material-ui/icons/Cancel";
import SuccessIcon from "@material-ui/icons/CheckCircle";
import LaunchIcon from "@material-ui/icons/Launch";
import RetryIcon from "@material-ui/icons/Refresh";
import clsx from "clsx";
import axios, { CancelToken } from "axios";
import { DataTypeId } from "../common/Symbols";

const FileStatus = Object.freeze({
    waiting: 'waiting',
    uploading: 'uploading',
    finishing: 'finishing',
    success: 'success',
    cancelled: 'cancelled',
    failed: 'failed',

    isActive: function (status) {
        return status === this.uploading || status === this.finishing;
    }
});


const dropStyles = theme => ({
    dropArea: {
        background: theme.palette.background.default,
        width: '100%',
        height: ({ height }) => `calc(${height} - ${theme.spacing(9)}px)`,
        outline: 'transparent',
        border: 'solid 2px transparent'
    },
    emptyDropArea: {
        borderRadius: '25%',
    },
    activeDropArea: {
        borderColor: theme.palette.primary.main
    },
    fileList: {
        background: theme.palette.background.default,
        width: '95%',
        maxHeight: ({ height }) => `calc(${height} - ${theme.spacing(9)}px)`,
        overflow: 'auto',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
    },
    dropMsg: {
        display: 'block',
        textAlign: 'center',
        marginTop: theme.spacing(3)
    },
    dropIt: {
        position: 'absolute',
        top: 0,
        left: 0,
        background: theme.palette.background.default
    },
    backToDrop: {
        position: 'absolute',
        left: theme.spacing(2),
        top: ({ height }) => `calc(${height} - ${theme.spacing(8)}px)`
    },
    goToList: {
        position: 'absolute',
        right: theme.spacing(2),
        top: ({ height }) => `calc(${height} - ${theme.spacing(8)}px)`

    },
    fileItem: {
        marginTop: theme.spacing(1),
        border: 'solid 1px'
    },
    [FileStatus.waiting]: {
        borderColor: theme.palette.action.active,
        background: theme.palette.background.default
    },
    [FileStatus.uploading]: {
        borderColor: theme.palette.primary.main,
        background: theme.palette.primary.light
    },
    [FileStatus.finishing]: {
        borderColor: theme.palette.primary.main,
        background: theme.palette.primary.light
    },
    [FileStatus.success]: {
        borderColor: theme.palette.primary.light,
        background: theme.palette.background.paper
    },
    [FileStatus.cancelled]: {
        borderColor: theme.palette.error.main,
        background: theme.palette.background.default
    },
    [FileStatus.failed]: {
        borderColor: theme.palette.error.main,
        background: theme.palette.error.light
    }
});

function MultiIconButton({
                             DefaultIcon, OverIcon, onMouseEnter, onMouseLeave,
                             defaultColor, overColor, ...other
                         }) {
    const [state, setState] = useState('default');

    const handleMouseEnter = e => {
        setState('over');
        if (onMouseEnter) {
            onMouseEnter(e);
        }
    };

    const handleMouseLeave = e => {
        setState('default');
        if (onMouseLeave) {
            onMouseLeave(e);
        }
    };

    const Icon = (state === 'over' && OverIcon) || DefaultIcon;
    const color = (state === 'over' && overColor) || defaultColor;

    return <IconButton {...other}
                       onMouseEnter={handleMouseEnter}
                       onMouseLeave={handleMouseLeave}
                       color={color}>
        <Icon/>
    </IconButton>
}

function uploaderReducer(state, action) {
    switch (action.type) {
        case 'add': {
            let { files } = action;
            files.forEach(file => file.status = FileStatus.waiting);
            files = [...state.files, ...files];
            return { ...state, files, step: 1 };
        }

        case 'goto': {
            return { ...state, step: action.step };
        }

        case 'next': {
            let { current, files } = state;

            if (!current || !FileStatus.isActive(current.status)) {
                current = files.find(file => file.status === FileStatus.waiting);
            }

            return { ...state, current };
        }

        case 'currentProgress': {
            return { ...state, currentProgress: action.value };
        }

        case 'refresh': {
            return { ...state };
        }

        default: {
            return state
        }
    }
}

function FileItem({ classes, file, status, launch, dispatch }) {
    let progress, action;

    const handleLaunch = e => {
        e.stopPropagation();
        launch(file.id)
    };

    const cancel = (file, status = FileStatus.waiting) => e => {
        e.stopPropagation();
        if (status === FileStatus.uploading) {
            file.cancelToken.cancel();
        } else {
            file.status = FileStatus.cancelled;
        }
        dispatch({ type: 'refresh' });
    };

    const handleRetry = e => {
        e.stopPropagation();
        file.status = FileStatus.waiting;
        dispatch({ type: 'next' });
    };

    switch (status) {
        case FileStatus.uploading: {
            progress = <LinearProgress variant="determinate" value={file.progress} className='full-width'/>;
            action = (
                <MultiIconButton edge="end"
                                 DefaultIcon={UploadIcon}
                                 OverIcon={CancelIcon}
                                 onClick={cancel(file, FileStatus.uploading)}/>
            );
        }
            break;

        case FileStatus.waiting: {
            action = (
                <MultiIconButton edge="end"
                                 DefaultIcon={ScheduleIcon}
                                 OverIcon={CancelIcon}
                                 onClick={cancel(file)}/>
            );
        }
            break;

        case FileStatus.finishing: {
            progress = <LinearProgress/>;
        }
            break;

        case FileStatus.success: {
            action = (
                <MultiIconButton edge="end"
                                 DefaultIcon={SuccessIcon}
                                 OverIcon={LaunchIcon}
                                 onClick={handleLaunch}
                                 defaultColor="primary"/>
            );
        }
            break;

        default: {
            action = (
                <MultiIconButton edge="end"
                                 DefaultIcon={RetryIcon}
                                 onClick={handleRetry}/>
            );
        }
    }

    return <ListItem className={clsx(classes.fileItem, classes[status])}>
        <ListItemText primary={file.name}
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                          <React.Fragment>
                              <Typography component="span"
                                          variant="body2"
                                          className={classes.inline}
                                          color="textPrimary">
                                  {status}
                              </Typography>
                              <br/>
                              {progress}
                          </React.Fragment>
                      }/>
        <ListItemSecondaryAction>
            {action}
        </ListItemSecondaryAction>
    </ListItem>;
}

function FileUploader({ dataType, onItemPickup, width, height, classes, theme }) {
    const [state, dispatch] = useReducer(uploaderReducer, {
        step: 0,
        files: []
    });

    const onDrop = useCallback(files => {
        dispatch({ type: 'add', files });
        dispatch({ type: 'next' });
    }, []);

    const { step, files, current, currentProgress } = state;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    useEffect(() => {
        if (current) {
            current.status = FileStatus.uploading;
            current.cancelToken = CancelToken.source();
            const subscription = dataType.upload(current, {
                filename: current.name,
                onUploadProgress: event => {
                    current.progress = Math.round((event.loaded * 100) / event.total);
                    if (current.progress === 100) {
                        current.status = FileStatus.finishing;
                    }
                    dispatch({
                        type: 'currentProgress',
                        value: current.progress
                    });
                },
                cancelToken: current.cancelToken.token
            }).subscribe(
                response => {
                    if (response) {
                        current.id = response.id;
                    }
                    current.status = FileStatus.success;
                    dispatch({ type: 'next' });
                },
                error => {
                    console.log('ERROR');
                    if (axios.isCancel(error)) {
                        current.status = FileStatus.cancelled;
                        current.message = 'Cancelled by user';
                    } else {
                        current.status = FileStatus.failed;
                        current.message = error.message;
                    }
                    dispatch({ type: 'next' });
                }
            );

            return () => {
                subscription.unsubscribe();
                if (current && FileStatus.isActive(current.status)) {
                    current.cancelToken.cancel();
                }
            };
        }
    }, [current]);

    const launch = id => onItemPickup({ [DataTypeId]: dataType.id, id });

    const fileList = files.map(
        (file, index) => <FileItem key={`file_${index}`}
                                   status={file.status}
                                   file={file}
                                   classes={classes}
                                   launch={launch}
                                   dispatch={dispatch}/>
    );

    let dropIt;
    if (isDragActive) {
        dropIt = <div
            className={clsx(
                'relative', 'flex', 'justify-content-center', 'align-items-center', 'column',
                'full-width', 'full-height',
                classes.dropIt,
                files.length === 0 && classes.emptyDropArea
            )}>
            <div className={classes.dropMsg}>
                <UploadIcon fontSize='large' color="primary"/>
                <Typography color='textPrimary' variant='h6'>
                    Drop it!
                </Typography>
            </div>
        </div>;
    }

    return (
        <ResponsiveContainer>
            <div key='drop'
                 className={clsx(
                     'relative', 'flex', 'justify-content-center', 'align-items-center', 'column',
                     classes.dropArea,
                     files.length === 0 && classes.emptyDropArea,
                     isDragActive && classes.activeDropArea
                 )}
                 {...getRootProps()}>
                <input {...getInputProps()} />
                <div key='list'
                     className={classes.fileList}>
                    <List>
                        {fileList}
                        <ListItem component="div" className={classes.dropMsg}>
                            <UploadIcon fontSize='large'/>
                            <Typography color='textPrimary' variant='h6'>
                                Drop files here
                            </Typography>
                            <Typography variant='caption' color='textSecondary'>
                                Or click to select files
                            </Typography>
                        </ListItem>
                    </List>
                </div>
                {dropIt}
            </div>
        </ResponsiveContainer>
    );
}

export default withStyles(dropStyles, { withTheme: true })(FileUploader);
