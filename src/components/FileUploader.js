import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { useDropzone } from "react-dropzone";
import '../common/FlexBox.css';
import {
    Typography,
    withStyles,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    LinearProgress, ListItemSecondaryAction, TextField
} from "@material-ui/core";
import UploadIcon from "@material-ui/icons/CloudUpload";
import ScheduleIcon from "@material-ui/icons/Schedule";
import CancelIcon from "@material-ui/icons/Cancel";
import DeleteIcon from "@material-ui/icons/Delete";
import SuccessIcon from "@material-ui/icons/CheckCircle";
import LaunchIcon from "@material-ui/icons/Launch";
import BanedIcon from "@material-ui/icons/Block";
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
    },

    isError: function (status) {
        return status === this.cancelled || status === this.failed;
    }
});


const dropStyles = theme => ({
    dropArea: {
        background: theme.palette.background.default,
        width: '100%',
        height: ({ height }) => `calc(${height} - ${theme.spacing(9)}px)`,
        outline: 'transparent',
        border: 'solid 2px transparent',
        boxSizing: 'border-box'
    },
    emptyDropArea: {
        borderRadius: '25%',
        justifyContent: 'center',
        minHeight: theme.spacing(40)
    },
    activeDropArea: {
        borderColor: theme.palette.primary.main,
        background: theme.palette.background.default
    },
    blockedDropArea: {
        borderColor: theme.palette.error.main,
        background: theme.palette.background.default
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
        zIndex: 1
    },
    backToDrop: {
        position: 'absolute',
        left: theme.spacing(2),
        top: ({ height }) => `calc(${height} - ${theme.spacing(8)}px)`
    },
    fileItem: {
        marginTop: theme.spacing(1),
        borderWidth: 0,
        padding: 0
    },
    launchButton: {
        width: `calc(100% - ${theme.spacing(7)}px)`,
        '& .MuiButton-label': {
            justifyContent: 'left',
            wordBreak: 'break-word'
        }
    },
    [FileStatus.waiting]: {
        background: theme.palette.background.default
    },
    [FileStatus.uploading]: {
        borderColor: theme.palette.primary.main,
        background: theme.palette.background.default
    },
    [FileStatus.finishing]: {
        background: theme.palette.background.paper
    },
    [FileStatus.success]: {
        background: theme.palette.background.paper
    },
    [FileStatus.cancelled]: {
        background: theme.palette.background.default
    },
    [FileStatus.failed]: {
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
    state.filesUpdated = false;
    delete state.error;

    switch (action.type) {
        case 'add': {
            state.filesUpdated = new Date().getTime();
            let { files } = action;
            const { max, rootId } = action;
            files.forEach(file => file.status = FileStatus.waiting);
            if (rootId) {
                if (!files[0].fake) {
                    files[0].id = rootId;
                    files[0].filename = state.files[0].filename;
                    files[0].customName = state.files[0].customName;
                }
            } else {
                files = [...state.files, ...files];
            }
            const dropOverflow = files.length > max;
            if (dropOverflow) {
                return { ...state, dropOverflow };
            }
            return { ...state, files, dropOverflow };
        }

        case 'submit': {
            state.files.forEach(file => {
                if (FileStatus.isError(file.status)) {
                    file.status = FileStatus.waiting;
                }
            });
        }

        // eslint-disable-next-line no-fallthrough
        case 'next': {
            state.filesUpdated = new Date().getTime();

            let { current, files } = state;

            if (!current || !FileStatus.isActive(current.status)) {
                current = files.find(file => file.status === FileStatus.waiting);
            }

            return { ...state, current, done: !current };
        }

        case 'currentProgress': {
            return { ...state, currentProgress: action.value };
        }

        case 'refresh': {
            return { ...state, filesUpdated: new Date().getTime() };
        }

        case 'delete': {
            const { file, rootId } = action;
            state.filesUpdated = new Date().getTime();
            const index = state.files.indexOf(file);
            if (index !== -1) {
                const files = [...state.files];
                files.splice(index, 1);
                if (files.length === 0 && rootId) {
                    files.push({
                        id: rootId,
                        filename: file.filename,
                        name: file.filename,
                        customName: file.filename,
                        fake: true
                    });
                }
                return { ...state, files };
            }
            return state;
        }

        case 'error': {
            return { ...state, error: true, done: false };
        }

        default: {
            return state
        }
    }
}

function FileItem({ file, rootId, status, launch, dispatch, disabled, classes }) {
    let progress, action;

    const handleLaunch = e => {
        e.stopPropagation();
        launch(file.id)
    };

    const cancel = (status = FileStatus.waiting) => e => {
        e.stopPropagation();
        if (status === FileStatus.uploading) {
            file.cancelToken.cancel();
        } else {
            file.status = FileStatus.cancelled;
        }
        dispatch({ type: 'refresh' });
    };

    const handleDelete = e => {
        e.stopPropagation();
        dispatch({ type: 'delete', file, rootId });
    };

    const handleChange = event => {
        file.customName = event.target.value;
        dispatch({ type: 'refresh' });
    };

    switch (status) {
        case FileStatus.uploading: {
            progress = <LinearProgress variant="determinate" value={file.progress} className='full-width'/>;
            action = (
                <MultiIconButton edge="end"
                                 DefaultIcon={UploadIcon}
                                 OverIcon={CancelIcon}
                                 onClick={cancel(FileStatus.uploading)}/>
            );
        }
            break;

        case FileStatus.waiting: {
            if (!file.fake) {
                action = (
                    <MultiIconButton edge="end"
                                     DefaultIcon={ScheduleIcon}
                                     OverIcon={rootId ? DeleteIcon : CancelIcon}
                                     onClick={rootId ? handleDelete : cancel(file)}/>
                );
            }
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
                                 OverIcon={DeleteIcon}
                                 onClick={handleDelete}
                                 defaultColor="primary"/>
            );
        }
            break;

        default: {
            if (!file.fake) {
                action = (
                    <MultiIconButton edge="end"
                                     DefaultIcon={DeleteIcon}
                                     onClick={handleDelete}/>
                );
            }
        }
    }
    let primary;
    if (file.status === FileStatus.success) {
        primary = <Button className={classes.launchButton}
                          variant="outlined"
                          color="primary"
                          startIcon={<LaunchIcon/>}
                          onClick={handleLaunch}>
            {file.customName || file.name}
        </Button>;
    } else {
        primary = <TextField label="Name"
                             variant="filled"
                             multiline
                             disabled={disabled}
                             error={FileStatus.isError(file.status)}
                             value={file.customName || file.name || ''}
                             helperText={!file.fake && file.status}
                             className={clsx(
                                 ((file.fake || file.status === FileStatus.finishing) && 'full-width') || classes.launchButton
                             )}
                             onChange={handleChange}
                             onClick={e => e.stopPropagation()}/>
    }

    return <ListItem className={clsx(classes.fileItem, classes[status])}>
        <ListItemText primaryTypographyProps={{ component: 'div' }}
                      primary={primary}
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                          <React.Fragment>
                              {progress}
                          </React.Fragment>
                      }/>
        <ListItemSecondaryAction>
            {action}
        </ListItemSecondaryAction>
    </ListItem>;
}

function computeFilesValue(files) {
    let filesValue;

    if (files.length) {
        filesValue = files.map(file => {
            const fileValue = { filename: file.customName || file.name };
            if (file.id) {
                fileValue.id = file.id;
            }
            return fileValue;
        });
        if (filesValue.length === 1) {
            filesValue = filesValue[0];
        }
    } else {
        filesValue = {};
    }

    return filesValue;
}

function FileUploader({ dataType, multiple, max, disabled, onItemPickup, width, height, classes, theme, onChange, value, submitter, onSubmitDone, rootId }) {
    const [state, dispatch] = useReducer(uploaderReducer, {
        files: [],
        done: false
    });

    const { files, current, dropOverflow, currentProgress, filesUpdated, done, error } = state;

    useEffect(() => {
        if (rootId) {
            const file = {
                ...value,
                id: rootId,
                filename: value.filename,
                name: value.filename,
                customName: value.filename,
                fake: true
            };
            const addFakeFile = { type: 'add', files: [file], max: 2, rootId };
            dispatch(addFakeFile);
            if (!file.customName) {
                const subscription = dataType.get(rootId, { viewport: '{filename}' }).subscribe(
                    ({ filename }) => {
                        file.filename =
                            file.customName =
                                file.name = filename;
                        dispatch(addFakeFile);
                    }
                );

                return () => subscription.unsubscribe();
            }
        }
    }, []);

    useEffect(() => {
        const subscription = submitter.subscribe(() => {
            dispatch({ type: 'submit' });
        });

        return () => subscription.unsubscribe();
    }, [submitter]);

    useEffect(() => {
        if (done) {
            let filesValue;
            if (files.find(file => file.status !== FileStatus.success)) {
                dispatch({ type: 'error' });
            } else {
                filesValue = computeFilesValue(files);
            }
            onSubmitDone(filesValue);
        }
    }, [done, files]);

    max = (rootId && 2) || Math.max(Number(max), 0) || Infinity;
    multiple = ((multiple === undefined) || Boolean(multiple)) && max > files.length + 1;
    if (max === Infinity && !multiple) {
        max = files.length + 1;
    }

    const onDrop = useCallback(files => {
        dispatch({ type: 'add', files, max, rootId });
    }, [max, rootId]);

    const noClick = files.length === max;

    const { getRootProps, getInputProps, isDragActive, draggedFiles } = useDropzone({
        onDrop,
        multiple,
        noClick,
        disabled
    });

    useEffect(() => {
        if (filesUpdated) {
            const filesValue = computeFilesValue(files);

            if (JSON.stringify(filesValue) !== JSON.stringify(value)) {
                onChange(filesValue);
            }
        }
    }, [filesUpdated, onChange, files, value])

    useEffect(() => {
        if (current) {
            current.status = FileStatus.uploading;
            current.cancelToken = CancelToken.source();
            const filename = current.customName || current.name;
            let submit;
            if (current.fake) {
                submit = dataType.post({ id: rootId, filename }, {
                    viewport: '{_id}'
                })
            } else {
                submit = dataType.upload(current, {
                    id: rootId,
                    filename,
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
                });
            }
            const subscription = submit.subscribe(
                response => {
                    if (response) {
                        current.id = response.id;
                    }
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
    }, [current, rootId]);

    const launch = id => onItemPickup({ [DataTypeId]: dataType.id, id });

    const fileList = files.map(
        (file, index) => <FileItem key={`file_${index}`}
                                   status={file.status}
                                   file={file}
                                   classes={classes}
                                   launch={launch}
                                   dispatch={dispatch}
                                   disabled={disabled}
                                   rootId={rootId}/>
    );
    const remaining = max - files.length;
    let dropIt;
    let activeDropClass;
    if (isDragActive) {
        let dropItIcon;
        let dropItMsg;

        if (
            (draggedFiles.length <= remaining) &&
            (multiple || draggedFiles.length === 1)
        ) {
            dropItIcon = <UploadIcon fontSize='large' color="primary"/>;
            dropItMsg = 'Drop it!';
            activeDropClass = classes.activeDropArea;
        } else {
            dropItIcon = <BanedIcon fontSize='large' color="error"/>;
            activeDropClass = classes.blockedDropArea;
            if (remaining) {
                dropItMsg = `Please select just ${remaining} file${remaining > 1 ? 's' : ''}!`;
            } else {
                dropItMsg = `${files.length} files is enough!`
            }
        }
        dropIt = <div
            className={clsx(
                'relative', 'flex', 'justify-content-center', 'align-items-center', 'column',
                'full-width', 'full-height',
                classes.dropIt,
                files.length === 0 && classes.emptyDropArea,
                activeDropClass
            )}>
            <div className={classes.dropMsg}>
                {dropItIcon}
                <Typography color='textPrimary' variant='h6'>
                    {dropItMsg}
                </Typography>
            </div>
        </div>;
    }

    let dropInstructions;
    if (!disabled && files.length < max) {
        const dropFilesMsg = rootId ? 'Drop a file to update the content' : 'Drop files here'
        dropInstructions = (
            <ListItem component="div" className={classes.dropMsg}>
                <UploadIcon fontSize='large'/>
                <Typography color='textPrimary' variant='h6'>
                    {dropFilesMsg}
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                    Or click to select
                </Typography>
                {
                    dropOverflow &&
                    <Typography variant='subtitle1' color='error'>
                        Select just {remaining} file{remaining > 1 ? 's' : ''}!
                    </Typography>
                }
            </ListItem>
        );
    }

    return (
        <div key='drop'
             className={clsx(
                 'relative', 'flex', 'align-items-center', 'column',
                 classes.dropArea,
                 files.length === 0 && classes.emptyDropArea,
                 activeDropClass
             )}
             {...getRootProps()}>
            <input {...getInputProps()} />
            {
                error &&
                <Typography variant='caption' color='error'>
                    Some files weren't uploaded. Remove or try to upload them again.
                </Typography>
            }
            <div key='list'
                 className={classes.fileList}>
                <List>
                    {fileList}
                    {dropInstructions}
                </List>
            </div>
            {dropIt}
        </div>
    );
}

export default withStyles(dropStyles, { withTheme: true })(FileUploader);
