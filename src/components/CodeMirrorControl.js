import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import reactiveControlFor from "./reactiveControlFor";
import { from } from "rxjs";
import { IconButton, makeStyles, Typography } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import clsx from "clsx";

require('codemirror/lib/codemirror.css');

const useStyles = makeStyles(theme => ({
    header: {
        minHeight: theme.spacing(7),
        background: theme.palette.background.default,
        borderTopLeftRadius: theme.spacing(.5),
        borderTopRightRadius: theme.spacing(.5),
        alignItems: 'center',
        padding: theme.spacing(0, 2)
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
                const mode = property.propertySchema.contentMediaType;
                const subscription = from(import(`codemirror/mode/${mode}/${mode}`)).subscribe(
                    () => {
                        const cm = CodeMirror.fromTextArea(textEl, {
                            lineNumbers: true,
                            mode
                        });
                        cm.on('change', () => {
                            if (cm.__cleared__) {
                                cm.__cleared__ = false;
                            } else {
                                onChange(cm.getValue());
                            }
                        });
                        cm.on('blur', onBlur);
                        setCM(cm);
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
        }, [value]);

        let clear;
        if (!readOnly && !disabled && value !== undefined && value !== null) {
            clear = (
                <IconButton onClick={onClear}>
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
                <textarea ref={ref}
                          defaultValue={value}
                          autoFocus={autoFocus}/>
            </div>
        );
    }
);

export default CodeMirrorControl;
