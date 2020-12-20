import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import { Subject } from "rxjs";
import { IconButton, makeStyles, Typography, useMediaQuery } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import clsx from "clsx";

import 'codemirror/addon/mode/loadmode';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';

import { useFormContext } from "./FormContext";
import { useSpreadState } from "../common/hooks";
import CodeMirrorEditor from "./CodeMirrorEditor";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from '@material-ui/core/DialogTitle';
import useTheme from "@material-ui/core/styles/useTheme";
import ErrorMessages from "./ErrorMessages";
import SvgIcon from "@material-ui/core/SvgIcon";

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


const OpenInIcon = () => (
    <SvgIcon>
        <polygon points="21,11 21,3 13,3 16.29,6.29 6.29,16.29 3,13 3,21 11,21 7.71,17.71 17.71,7.71"/>
    </SvgIcon>
);

const OpenInOffIcon = () => (
    <SvgIcon>
        <path d="M22,3.41l-5.29,5.29L20,12h-8V4l3.29,3.29L20.59,2L22,3.41z M3.41,22l5.29-5.29L12,20v-8H4l3.29,3.29L2,20.59L3.41,22z"/>
    </SvgIcon>
);

export default function CodeMirrorControl({
                                              property, title, value, disabled, readOnly, errors, onChange, onDelete,
                                              mime, mode, theme, lineNumbers, viewportMargin, gutters, lint, foldGutter,
                                              autoHeight, addons, customCSS
                                          }) {
    const { initialFormValue } = useFormContext();
    const [state, setState] = useSpreadState({
        controlValue: value.get(),
        open: false
    });

    const classes = useStyles();

    const eraser = useRef(new Subject());

    const muiTheme = useTheme();
    const xs = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const { controlValue, open } = state;

    const setOpen = open => setState({ open });

    const handleClose = () => {
        setOpen(false);
        value.changed().next(value.get());
    };

    useEffect(() => {
        const subscription = value.changed().subscribe(controlValue => setState({ controlValue }));
        return () => subscription.unsubscribe();
    }, [value]);

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
            <IconButton onClick={() => setState({ open: true })}>
                <OpenInIcon/>
            </IconButton>
        );
    }
    let clear;
    if (!readOnly && !disabled && controlValue !== undefined && controlValue !== null) {
        clear = (
            <IconButton onClick={handleDelete}>
                <ClearIcon/>
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
                              eraser={eraser.current}>

                <div className={clsx('flex', classes.header)}>
                    <Typography variant="subtitle2">
                        {title}
                    </Typography>
                    <div className="grow-1"/>
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
                    <div className="grow-1"/>
                    <div className={classes.closeDialogButton}>
                        <IconButton aria-label="close" onClick={handleClose}>
                            <OpenInOffIcon/>
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
                                          eraser={eraser.current}/>
                    </ErrorMessages>
                </DialogContent>
            </Dialog>
        </>
    );
}
