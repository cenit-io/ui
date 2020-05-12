import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import reactiveControlFor from "./reactiveControlFor";
import { from } from "rxjs";
import { IconButton, makeStyles, Typography } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import clsx from "clsx";

import 'codemirror/addon/mode/loadmode';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

const useStyles = makeStyles(theme => ({
    root: {
        paddingBottom: theme.spacing(.5)
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
    }
}));

const CodeMirrorControl = reactiveControlFor(
    ({
         property,
         title,
         value,
         disabled,
         readOnly,
         error,
         onChange,
         autoFocus,
         onClear,
         mime,
         mode
     }) => {
        const ref = useRef(null);
        const [editor, setEditor] = useState(null);

        const classes = useStyles();

        const textEl = ref.current;

        useEffect(() => {
            if (textEl) {
                const editor = CodeMirror.fromTextArea(textEl, {
                    lineNumbers: true,
                    theme: 'monokai'
                });

                const handleChange = () => {
                    if (editor.__cleared__) {
                        editor.__cleared__ = false;
                    } else {
                        onChange(editor.getValue());
                    }
                };

                editor.on('change', handleChange);
                editor.on('paste', handleChange);

                const cmMime = mime || property.propertySchema.contentMediaType;
                const cmMode = mode || (CodeMirror.findModeByMIME(cmMime) || CodeMirror.findModeByMIME('text/plain')).mode;

                const subscription = from(import(`codemirror/mode/${cmMode}/${cmMode}`)).subscribe(
                    () => {
                        editor.setOption('mode', cmMime);
                        CodeMirror.autoLoadMode(editor, cmMode);
                        setEditor(editor);
                    }
                );

                return () => subscription.unsubscribe();
            }
        }, [textEl, property, mime, mode]);

        useEffect(() => {
            if (editor) {
                editor.setOption('readOnly', disabled ? 'nocursor' : readOnly);
            }
        }, [readOnly, disabled, editor]);

        useEffect(() => {
            if (editor) {
                if (value || value === '') {
                    if (value !== editor.getValue()) {
                        editor.setValue(value);
                    }
                } else {
                    editor.__cleared__ = true;
                    editor.setValue('');
                }
            }
        }, [editor, value]);

        let clear;
        if (!readOnly && !disabled && value !== undefined && value !== null) {
            clear = (
                <IconButton onClick={onClear}>
                    <ClearIcon/>
                </IconButton>
            );
        }

        return (
            <div className={clsx(classes.root, error && classes.error)}>
                <div className={clsx('flex', classes.header)}>
                    <Typography variant="subtitle2">
                        {title}
                    </Typography>
                    <div className="grow-1"/>
                    {clear}
                </div>
                <input ref={ref}
                       multiple={true}
                       hidden={true}
                       defaultValue={value}
                       autoFocus={autoFocus}/>
            </div>
        );
    }
);

export default CodeMirrorControl;
