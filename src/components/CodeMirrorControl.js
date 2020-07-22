import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import { from, of } from "rxjs";
import { IconButton, makeStyles, Typography } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import clsx from "clsx";

import 'codemirror/addon/mode/loadmode';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';

import zzip from "../util/zzip";
import Random from "../util/Random";

const useStyles = makeStyles(theme => ({
    root: {
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
    }
}));

export default function CodeMirrorControl({
                                              property,
                                              title,
                                              value,
                                              disabled,
                                              readOnly,
                                              errors,
                                              onChange,
                                              onDelete,
                                              mime,
                                              mode,
                                              theme,
                                              lineNumbers,
                                              viewportMargin,
                                              gutters,
                                              lint,
                                              foldGutter,
                                              autoHeight,
                                              addons,
                                              customCSS
                                          }) {
    const textElRef = useRef(null);
    const cleared = useRef(false);
    const [editor, setEditor] = useState(null);
    const classes = useStyles();

    const customCssRef = useRef(`c${Random.string()}`);

    useEffect(() => {
        if (textElRef.current) {
            const opts = {};

            if (gutters) {
                opts.gutters = gutters;
            }

            const editor = CodeMirror.fromTextArea(textElRef.current, opts);

            const handleChange = () => {
                if (cleared.current) {
                    cleared.current = false;
                    editor.save();
                } else {
                    onChange(editor.getValue())
                }
            };

            editor.on('change', handleChange);
            editor.on('paste', handleChange);

            setEditor(editor);
        }
    }, []);

    useEffect(() => {
        if (editor) {
            const cmMime = mime || property.propertySchema.contentMediaType;
            const cmMode = (
                mode ||
                (
                    CodeMirror.findModeByMIME(cmMime) ||
                    CodeMirror.findModeByMIME('text/plain')
                ).mode
            );

            const subscription = zzip(
                (theme && from(import(`codemirror/theme/${theme || 'default'}.css`))) || of(true),
                from(import(`codemirror/mode/${cmMode}/${cmMode}`)),
                ...(addons || []).map(
                    addon => from(import(`codemirror/addon/${addon[0]}/${addon[1]}`))
                )
            ).subscribe(
                () => {
                    const opts = {
                        mode: cmMime,
                        lineNumbers,
                        lint,
                        foldGutter
                    };
                    if (theme) {
                        opts.theme = theme;
                    }
                    if (viewportMargin) {
                        opts.viewportMargin = viewportMargin;
                    }
                    Object.keys(opts).forEach(
                        opt => editor.setOption(opt, opts[opt])
                    );
                    CodeMirror.autoLoadMode(editor, cmMode);
                }
            );

            return () => subscription.unsubscribe();
        }

    }, [editor, property, mime, mode, addons, gutters, viewportMargin]);

    useEffect(() => {
        if (editor) {
            editor.setOption('readOnly', disabled ? 'nocursor' : readOnly);
        }
    }, [readOnly, disabled, editor]);

    useEffect(() => {
        if (editor) {
            const strValue = value || '';
            if (strValue !== editor.getValue()) {
                cleared.current = value === null || value === undefined;
                editor.setValue(strValue);
            }
        }
    }, [editor, value]);

    let clear;
    if (!readOnly && !disabled && value !== undefined && value !== null) {
        clear = (
            <IconButton onClick={onDelete}>
                <ClearIcon/>
            </IconButton>
        );
    }

    let styles = '';
    if (autoHeight) {
        styles = 'height: auto;'
    }

    const error = Boolean(errors && errors.length);

    const customStyles = ((editor && customCSS) || []).map(
        cls => `.${customCssRef.current} ${cls}`
    ).join(' ');

    return (
        <React.Fragment>
            <style>
                {`.${classes.root}.${customCssRef.current} .CodeMirror { resize: vertical; overflow: auto !important; ${styles} }`}
                {customStyles}
            </style>
            <div className={clsx(classes.root, customCssRef.current, error && classes.error)}>
                <div className={clsx('flex', classes.header)}>
                    <Typography variant="subtitle2">
                        {title}
                    </Typography>
                    <div className="grow-1"/>
                    {clear}
                </div>
                <textarea ref={textElRef}
                          hidden={true}/>
            </div>
        </React.Fragment>
    );
}
