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
         onBlur,
         autoFocus,
         onClear
     }) => {
        const ref = useRef(null);
        const [cm, setCM] = useState(null);

        const classes = useStyles();

        const textEl = ref.current;

        useEffect(() => {
            if (textEl) {
                const editor = CodeMirror.fromTextArea(textEl, {
                    lineNumbers: true,
                    theme: 'monokai'
                });

                editor.on('change', () => {
                    if (editor.__cleared__) {
                        editor.__cleared__ = false;
                    } else {
                        onChange(editor.getValue());
                    }
                });

                const mime = property.propertySchema.contentMediaType;
                const { mode } = CodeMirror.findModeByMIME(mime) || CodeMirror.findModeByMIME('text/plain');

                const subscription = from(import(`codemirror/mode/${mode}/${mode}`)).subscribe(
                    () => {
                        editor.setOption('mode', mime);
                        CodeMirror.autoLoadMode(editor, mode);
                        setCM(editor);
                    }
                );

                return () => subscription.unsubscribe();
            }
        }, [textEl, property]);

        useEffect(() => {
            if (cm) {
                cm.setOption('readOnly', disabled ? 'nocursor' : readOnly);
            }
        }, [readOnly, disabled, cm]);

        useEffect(() => {
            if (cm) {
                if (value) {
                    if (value !== cm.getValue()) {
                        cm.setValue(value);
                    }
                } else {
                    cm.__cleared__ = true;
                    cm.setValue('');
                }
            }
        }, [cm, value]);

        let clear;
        if (!readOnly && !disabled && value !== undefined && value !== null) {
            clear = (
                <IconButton onClick={onClear}>
                    <ClearIcon/>
                </IconButton>
            );
        }

        return (
            <div className={clsx(error && classes.error)}>
                <div className={clsx('flex', classes.header)}>
                    <Typography variant="subtitle2">
                        {title}
                    </Typography>
                    <div className="grow-1"/>
                    {clear}
                </div>
                <textarea ref={ref}
                          defaultValue={value}
                          autoFocus={autoFocus}/>
            </div>
        );
    }
);

export default CodeMirrorControl;
