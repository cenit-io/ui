import React, { useEffect, useRef } from 'react';
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
import { useFormContext } from "./FormContext";
import { useSpreadState } from "../common/hooks";

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
    const [state, setState] = useSpreadState();
    const classes = useStyles();

    const { editor } = state;
    const setEditor = editor => setState({ editor });

    const { initialFormValue } = useFormContext();

    const customCssRef = useRef(`c${Random.string()}`);

    useEffect(() => {
        if (textElRef.current) {
            const opts = {};

            if (gutters) {
                opts.gutters = gutters;
            }

            const editor = CodeMirror.fromTextArea(textElRef.current, opts);

            setEditor(editor);
        }
    }, []);

    useEffect(() => {
        if (editor) {
            let cmMime = mime || property.propertySchema.contentMediaType || 'text/plain';
            const modeInfo = CodeMirror.findModeByMIME(cmMime);
            if (modeInfo) {
                cmMime = modeInfo.mime || cmMime;
            }
            const cmMode = (
                mode || (
                    modeInfo || CodeMirror.findModeByMIME('text/plain')
                ).mode
            );

            const subscription = zzip(
                (theme && from(import(`codemirror/theme/${theme || 'default'}.css`))) || of(true),
                (cmMode === 'null' && of(true)) || from(import(`codemirror/mode/${cmMode}/${cmMode}`)),
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
            const handleChange = () => {
                if (cleared.current) {
                    cleared.current = false;
                    editor.save();
                } else {
                    value.set(editor.getValue());
                    onChange && onChange(editor.getValue());
                }
                setState({}); // to refresh
            };

            editor.on('change', handleChange);
            editor.on('paste', handleChange);
        }

        const subscription = value.changed().subscribe(
            v => {
                if (editor) {
                    const strValue = v || '';
                    if (strValue !== editor.getValue()) {
                        cleared.current = v === null || v === undefined;
                        editor.setValue(strValue);
                    }
                }
            }
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [editor, value]);

    const handleDelete = () => {
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue !== undefined && initialValue !== null) {
            value.set(null);
        } else {
            value.delete();
        }
        cleared.current = true;
        editor.setValue('');
        onDelete && onDelete();
        setState({}); // to refresh
    };

    let clear;
    if (!readOnly && !disabled && value.get() !== undefined && value.cache !== null) {
        clear = (
            <IconButton onClick={handleDelete}>
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
                {`.${classes.root}.${customCssRef.current} .CodeMirror { ${styles} }`}
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
