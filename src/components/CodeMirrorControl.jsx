import React, { useRef } from 'react';
import CodeMirror from 'codemirror';
import { Subject } from "rxjs";
import { IconButton, Typography, useMediaQuery } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import ClearIcon from "@mui/icons-material/Clear";
import clsx from "clsx";

import 'codemirror/addon/mode/loadmode';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';

import { useFormContext } from "./FormContext";
import { useSpreadState } from "../common/hooks";
import CodeMirrorEditor from "./CodeMirrorEditor";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import ErrorMessages from "./ErrorMessages";
// import OpenInIcon from "@mui/icons-material/OpenInFullOutlined";
import OpenInIcon from '@mui/icons-material/Fullscreen';
// import OpenInOffIcon from "@mui/icons-material/CloseFullscreenOutlined";
import OpenInOffIcon from '@mui/icons-material/FullscreenExit';

const useStyles = makeStyles(theme => ({
  editor: {
    paddingBottom: theme.spacing(.5),
    borderBottom: `solid 2px ${theme.palette.background.default}`
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
    borderBottom: `solid 2px ${theme.palette.error.main}`
  },
  closeDialogButton: {
    marginBottom: 'auto',
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(1)
  }
}));

const ExtraModeTypes = {
  Java: ['text/x-java-source']
};

Object.keys(ExtraModeTypes).forEach(
  mode => {
    const cmode = CodeMirror.modeInfo.find(({ name }) => name === mode);
    if (cmode) {
      const mimes = [
        ExtraModeTypes[mode],
        cmode.mime,
        cmode.mimes
      ].flat()
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(v => v);
      if (mimes.length > 1) {
        cmode.mimes = mimes;
      } else {
        cmode.mime = mimes;
      }
    }
  }
);

export default function CodeMirrorControl(
  {
    property, title, value, disabled, readOnly, errors, onChange, onDelete,
    mime, mode, theme, lineNumbers, viewportMargin, gutters, lint, foldGutter,
    autoHeight, addons, customCSS, onBlur
  }
) {
  const { initialFormValue } = useFormContext();
  const [state, setState] = useSpreadState({
    controlValue: value.get(),
    open: false
  });

  const classes = useStyles();

  const eraser = useRef(new Subject());

  const muiTheme = useTheme();
  const xs = useMediaQuery(muiTheme.breakpoints.down('md'));

  const { controlValue, open } = state;

  const setOpen = open => setState({ open });

  const handleClose = () => {
    setOpen(false);
    value.changed().next(value.get());
  };

  const handleDelete = () => {
    const initialValue = value.valueFrom(initialFormValue);
    if (initialValue !== undefined && initialValue !== null) {
      value.set(null);
    } else {
      value.delete();
    }
    setState({ controlValue: value.cache });
    onDelete && onDelete();
    eraser.current.next();
  };

  let openInDialog;
  if (controlValue !== undefined && controlValue !== null) {
    openInDialog = (
      <IconButton onClick={() => setState({ open: true })} size="large">
        <OpenInIcon component="svg" />
      </IconButton>
    );
  }
  let clear;
  if (!readOnly && !disabled && controlValue !== undefined && controlValue !== null) {
    clear = (
      <IconButton onClick={handleDelete} size="large">
        <ClearIcon component="svg" />
      </IconButton>
    );
  }

  return (
    <>
      <CodeMirrorEditor value={value}
                        onChange={onChange}
                        mime={mime}
                        readOnly={readOnly}
                        disabled={disabled}
                        property={property}
                        customCSS={customCSS}
                        classes={classes}
                        mode={mode}
                        theme={theme}
                        errors={errors}
                        addons={addons}
                        autoHeight={autoHeight}
                        foldGutter={foldGutter}
                        gutters={gutters}
                        lint={lint}
                        viewportMargin={viewportMargin}
                        lineNumbers={lineNumbers}
                        eraser={eraser.current}
                        onBlur={onBlur}>

        <div className={clsx('flex', classes.header)}>
          <Typography variant="subtitle2" component="div">
            {title}
          </Typography>
          <div className="grow-1" />
          {openInDialog}
          {clear}
        </div>
      </CodeMirrorEditor>
      <Dialog open={open}
              onClose={handleClose}
              fullWidth={true}
              maxWidth="lg"
              fullScreen={xs}>
        <div className="flex">
          <DialogTitle className="flex">
            {title}
          </DialogTitle>
          <div className="grow-1" />
          <div className={classes.closeDialogButton}>
            <IconButton aria-label="close" onClick={handleClose} size="large">
              <OpenInOffIcon component="svg" />
            </IconButton>
          </div>
        </div>
        <DialogContent>
          <ErrorMessages errors={errors}>
            <CodeMirrorEditor value={value}
                              onChange={onChange}
                              mime={mime}
                              readOnly={readOnly}
                              disabled={disabled}
                              property={property}
                              customCSS={customCSS}
                              classes={classes}
                              mode={mode}
                              theme={theme}
                              errors={errors}
                              addons={addons}
                              autoHeight={autoHeight}
                              customHeight="70vh"
                              foldGutter={foldGutter}
                              gutters={gutters}
                              lint={lint}
                              viewportMargin={viewportMargin}
                              lineNumbers={lineNumbers}
                              eraser={eraser.current} />
          </ErrorMessages>
        </DialogContent>
      </Dialog>
    </>
  );
}
