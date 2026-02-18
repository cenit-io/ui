import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import { Box, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import UploadIcon from "@mui/icons-material/CloudUpload";
import BanedIcon from "@mui/icons-material/Block";
import Chip from "@mui/material/Chip";
import ClearIcon from "@mui/icons-material/Clear";

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
        <UploadIcon fontSize='large' />
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
    let isAllowedDrop;
    if (
      (draggedFiles.length <= remaining) &&
      (multiple || draggedFiles.length === 1)
    ) {
      dropItIcon = <UploadIcon fontSize='large' color="primary" />;
      dropItMsg = 'Drop it!';
      isAllowedDrop = true;
    } else {
      dropItIcon = <BanedIcon fontSize='large' color="error" />;
      isAllowedDrop = false;
      const r = multiple ? remaining : 1;
      if (r > 0) {
        dropItMsg = `Please select just ${r} file${r > 1 ? 's' : ''}!`;
      } else {
        dropItMsg = `${filesNames.length} files is enough!`
      }
    }
    dropIt = (
      <Box
        className={clsx(
          'relative', 'flex', 'justify-content-center', 'align-items-center', 'column',
          'full-width', 'full-height'
        )}>
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            borderColor: isAllowedDrop
              ? theme.palette.primary.main
              : theme.palette.error.main,
            background: theme.palette.background.default,
            borderStyle: 'solid',
            borderWidth: '2px',
          })}>
          {dropItIcon}
          <Typography color='textPrimary' variant='h6'>
            {dropItMsg}
          </Typography>
        </Box>
      </Box>
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
            sx={(theme) => ({ m: theme.spacing(1) })}
            label={fileName}
            onDelete={removeFile(fileName)} />
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
      <IconButton onClick={handleDelete} size="large">
        <ClearIcon />
      </IconButton>
    );
  }

  return (
    <Box>
      <Box
        className="flex"
        sx={(theme) => ({
          minHeight: theme.spacing(7),
          background: theme.palette.background.default,
          borderTopLeftRadius: theme.spacing(.5),
          borderTopRightRadius: theme.spacing(.5),
          alignItems: 'center',
          px: theme.spacing(2),
        })}>
        <Typography variant="subtitle2">
          {title}
        </Typography>
        <div className="grow-1" />
        {clear}
      </Box>
      <Box
        key='drop'
        className={clsx('relative', 'flex', 'align-items-center', 'column')}
        sx={(theme) => ({
          background: theme.palette.background.default,
          width: '100%',
          p: theme.spacing(1),
          outline: 'transparent',
          border: 'solid 2px transparent',
          boxSizing: 'border-box',
          ...(errors && untouched ? {
            color: theme.palette.error.main,
            '& *': {
              color: theme.palette.error.main
            }
          } : {}),
        })}
        {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="flex wrap">
          {filesChips}
        </div>
        {dropInstructions}
        {dropIt}
      </Box>
    </Box>
  );
}
