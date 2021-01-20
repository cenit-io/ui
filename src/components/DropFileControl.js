import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import { IconButton, makeStyles } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import UploadIcon from "@material-ui/icons/CloudUpload";
import BanedIcon from "@material-ui/icons/Block";
import Chip from "@material-ui/core/Chip";
import ClearIcon from "@material-ui/icons/Clear";

const useStyles = makeStyles(theme => ({
    dropArea: {
        background: theme.palette.background.default,
        width: '100%',
        padding: theme.spacing(1),
        outline: 'transparent',
        border: 'solid 2px transparent',
        boxSizing: 'border-box'
    },
    dropIt: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
    },
    dropMsg: {
        display: 'block',
        textAlign: 'center'
    },
    activeDropArea: {
        borderColor: theme.palette.primary.main,
        background: theme.palette.background.default
    },
    blockedDropArea: {
        borderColor: theme.palette.error.main,
        background: theme.palette.background.default
    },
    fileChip: {
        margin: theme.spacing(1)
    },
    header: {
        minHeight: theme.spacing(7),
        background: theme.palette.background.default,
        borderTopLeftRadius: theme.spacing(.5),
        borderTopRightRadius: theme.spacing(.5),
        alignItems: 'center',
        padding: theme.spacing(0, 2)
    },
    error: {
        color: theme.palette.error.main,
        '& *': {
            color: theme.palette.error.main
        }
    }
}));

export default function DropFileControl({
                                            title,
                                            value,
                                            disabled,
                                            readOnly,
                                            errors,
                                            onChange,
                                            onDelete,
                                            multiple,
                                            noClick,
                                            maxFiles
                                        }) {
    const [state, setState] = useSpreadState({
        files: {},
        untouched: true
    });

    const classes = useStyles();

    const { files, untouched } = state;

    maxFiles = maxFiles || 1;

    const filesNames = Object.keys(files);

    const remaining = maxFiles - filesNames.length;

    const onDrop = droppedFiles => {
        if (droppedFiles.length <= remaining) {
            const newFiles = { ...files };
            droppedFiles.forEach(file => newFiles[file.name] = file);
            setState({ files: newFiles, untouched: false });
            value.set(newFiles);
            onChange && onChange(newFiles);
        }
    };

    const { getRootProps, getInputProps, isDragActive, draggedFiles } = useDropzone({
        onDrop,
        multiple,
        noClick,
        disabled: disabled || !remaining
    });

    useEffect(() => {
        value.set(files);
    }, [value]);

    useEffect(() => {
        setState({ untouched: true });
    }, [errors]);

    let dropInstructions;
    if (!disabled && remaining > 0) {
        dropInstructions = (
            <>
                <UploadIcon fontSize='large'/>
                <Typography color='textPrimary' variant='h6'>
                    Drop a file here
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                    Or click to select
                </Typography>
            </>
        );
    }

    let dropIt;
    if (isDragActive) {
        let dropItIcon;
        let dropItMsg;
        let activeDropClass;
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
            const r = multiple ? remaining : 1;
            if (r > 0) {
                dropItMsg = `Please select just ${r} file${r > 1 ? 's' : ''}!`;
            } else {
                dropItMsg = `${filesNames.length} files is enough!`
            }
        }
        dropIt = (
            <div
                className={clsx(
                    'relative', 'flex', 'justify-content-center', 'align-items-center', 'column',
                    'full-width', 'full-height',
                    classes.dropIt,
                    activeDropClass
                )}>
                <div className={classes.dropMsg}>
                    {dropItIcon}
                    <Typography color='textPrimary' variant='h6'>
                        {dropItMsg}
                    </Typography>
                </div>
            </div>
        );
    }

    const removeFile = fileName => () => {
        const newFiles = { ...files };
        delete newFiles[fileName];
        setState({ files: newFiles });
        value.set(newFiles);
    };

    const filesChips = filesNames.map(
        fileName => (
            <Chip key={fileName}
                  className={classes.fileChip}
                  label={fileName}
                  onDelete={removeFile(fileName)}/>
        )
    );

    const handleDelete = () => {
        value.delete();
        setState({ files: [] });
        onDelete && onDelete();
    };

    let clear;
    if (!readOnly && !disabled && filesNames.length) {
        clear = (
            <IconButton onClick={handleDelete}>
                <ClearIcon/>
            </IconButton>
        );
    }

    return (
        <div>
            <div className={clsx('flex', classes.header)}>
                <Typography variant="subtitle2">
                    {title}
                </Typography>
                <div className="grow-1"/>
                {clear}
            </div>
            <div key='drop'
                 className={clsx(
                     'relative', 'flex', 'align-items-center', 'column',
                     classes.dropArea,
                     errors && untouched && classes.error
                 )}
                 {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="flex wrap">
                    {filesChips}
                </div>
                {dropInstructions}
                {dropIt}
            </div>
        </div>
    );
}
