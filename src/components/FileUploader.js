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
import ListIcon from "@material-ui/icons/List";
import CancelIcon from "@material-ui/icons/Cancel";
import clsx from "clsx";
import SwipeableViews from "react-swipeable-views";
import axios, { CancelToken } from "axios";

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
        borderRadius: '25%',
        width: '100%',
        height: ({ height }) => `calc(${height} - ${theme.spacing(12)}px)`
    },
    fileList: {
        background: theme.palette.background.default,
        height: ({ height }) => `calc(${height} - ${theme.spacing(12)}px)`,
        overflow: 'auto',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
    },
    trailing: {
        width: '100%',
        height: theme.spacing(3)
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
        borderRadius: 5,
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

        default: {
            return state
        }
    }
}

function FileItem({ classes, file, status }) {
    let progress, action;
    switch (status) {
        case FileStatus.uploading: {
            progress = <LinearProgress variant="determinate" value={file.progress} className='full-width'/>;
            action = (
                <IconButton edge="end" onClick={() => file.cancelToken.cancel()}>
                    <CancelIcon/>
                </IconButton>
            );
        }
            break;

        case FileStatus.waiting: {
            action = (
                <IconButton edge="end" onClick={() => status = FileStatus.cancelled}>
                    <CancelIcon/>
                </IconButton>
            );
        }
            break;
        case FileStatus.finishing: {
            progress = <LinearProgress/>;
        }
            break;
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

function FileUploader({ dataType, width, height, classes, theme }) {
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
                () => {
                    current.status = FileStatus.success;
                    dispatch({ type: 'next' });
                },
                error => {
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

    const fileList = files.map(
        (file, index) => <FileItem key={`file_${index}`} status={file.status} file={file} classes={classes}/>
    );

    return (
        <ResponsiveContainer>
            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            index={step}>
                <div key='drop'
                     className={clsx('flex', 'justify-content-center', 'align-items-center', 'column', classes.dropArea)}
                     {...getRootProps()}>
                    <input {...getInputProps()} />
                    <UploadIcon fontSize='large'/>
                    <Typography color='textPrimary' variant='h6'>
                        {isDragActive ? 'Drop it!' : 'Drop files here'}
                    </Typography>
                    {
                        !isDragActive &&
                        <Typography variant='caption' color='textSecondary'>
                            Or click to select files
                        </Typography>
                    }
                </div>

                <div key='list'
                     className={classes.fileList}>
                    <List>
                        {fileList}
                    </List>
                </div>
            </SwipeableViews>
            <div className={classes.actions}>
                {
                    step === 1 &&
                    <IconButton className={classes.backToDrop}
                                onClick={() => dispatch({ type: 'goto', step: 0 })}>
                        <UploadIcon fontSize='large'/>
                    </IconButton>
                }
                {
                    step === 0 && files.length > 0 &&
                    <IconButton className={classes.goToList}
                                onClick={() => dispatch({ type: 'goto', step: 1 })}>
                        <ListIcon fontSize='large'/>
                    </IconButton>
                }
            </div>
        </ResponsiveContainer>
    );
}

export default withStyles(dropStyles, { withTheme: true })(FileUploader);
