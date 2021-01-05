import React, { useEffect, useReducer, useRef } from 'react';
import CodeMirrorControl from "./CodeMirrorControl";
import spreadReducer from "../common/spreadReducer";
import scriptLoader from 'react-async-script-loader';
import { interval, Subject } from "rxjs";
import { debounce } from "rxjs/operators";
import { FormRootValue } from "../services/FormValue";
import { useFormContext } from "./FormContext";

const addons = [
    ['lint', 'lint.js'],
    ['lint', 'lint.css'],
    ['lint', 'json-lint.js'],
    ['fold', 'foldcode.js'],
    ['fold', 'foldgutter.js'],
    ['fold', 'brace-fold.js'],
    ['fold', 'foldgutter.css']
];

const gutters = ["CodeMirror-lint-markers", "CodeMirror-foldgutter"];
const customCSS = ['.CodeMirror-lint-marker-error { display: none }'];

const jsonStringify = value => JSON.stringify(value, null, 2);

function JsonControl({ onChange, onError, value, ...otherProps }) {

    const [state, setState] = useReducer(spreadReducer, {
        css: customCSS,
        errorDebounce: new Subject()
    });

    const { initialFormValue } = useFormContext();

    const valueProxy = useRef(new FormRootValue(''));

    const error = useRef(null);

    const { css, errorDebounce, autoHeight } = state;

    useEffect(() => {
        const subscription = value.changed().subscribe(
            v => valueProxy.current.set(jsonStringify(v), true)
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value]);

    useEffect(() => {
        const subscription = errorDebounce.pipe(
            debounce(() => interval(1500))
        ).subscribe(error => onError((error && [error]) || []));

        return () => subscription.unsubscribe();
    }, [errorDebounce, onError]);

    useEffect(() => {
        const subscription = valueProxy.current.changed().subscribe(
            json => {
                const blank = json === '' || json === undefined || json === null;
                const errorBeforeChange = error.current;
                let v;
                try {
                    v = JSON.parse(json);
                    error.current = null;
                } catch (e) {
                    error.current = blank ? null : e.message;
                }
                if (error.current) {
                    clearCss();
                    if (errorBeforeChange) {
                        errorDebounce.next(error.current);
                    } else {
                        onError([error.current]);
                    }
                } else {
                    if (blank) {
                        setState({ css: customCSS });
                        v = null;
                    } else {
                        clearCss();
                    }
                    if (v === null || v === undefined) {
                        const initialValue = value.valueFrom(initialFormValue);
                        if (initialValue !== undefined && initialValue !== null) {
                            value.set(null);
                        } else {
                            value.delete();
                        }
                        valueProxy.current.set(null);
                    } else {
                        value.set(v);
                    }
                    onChange(v);
                    errorDebounce.next(null);
                    onError([]);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [value, errorDebounce, onError, onChange, initialFormValue]);

    const clearCss = () => css?.length && setState({ css: null });

    return (
        <CodeMirrorControl {...otherProps}
                           lineNumbers={true}
                           addons={addons}
                           value={valueProxy.current}
                           gutters={gutters}
                           lint={true}
                           foldGutter={true}
                           autoHeight={autoHeight}
                           viewportMargin={Infinity}
                           mime="application/json"
                           customCSS={css}/>
    );
}

export default scriptLoader(
    'https://unpkg.com/jshint@2.9.6/dist/jshint.js',
    'https://unpkg.com/jsonlint@1.6.3/web/jsonlint.js'
)(JsonControl);
