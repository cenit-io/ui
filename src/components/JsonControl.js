import React, { useEffect, useReducer, useRef } from 'react';
import { StringValidator } from "./StringControl";
import CodeMirrorControl from "./CodeMirrorControl";
import reducer from "../common/reducer";
import scriptLoader from 'react-async-script-loader';
import { Key } from "../common/Symbols";
import Random from "../util/Random";
import { interval, Subject } from "rxjs";
import { debounce } from "rxjs/operators";

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

const isObject = v => v && typeof v === 'object';

const autoHeightFor = json => !json || json.split(/\r\n|\r|\n/).length < 20;

const jsonStringify = value => JSON.stringify(value, null, 2);

function JsonControl(props) {
    const [state, setState] = useReducer(reducer, {
            json: '',
            key: Random.string(),
            css: customCSS,
            errorDebounce: new Subject(),
            autoHeight: autoHeightFor(jsonStringify(props.value))
        })
    ;

    const { value, onChange, onError, errors } = props;

    const propValue = useRef(value);
    const error = useRef(null);

    const { json, key, css, errorDebounce, autoHeight } = state;

    useEffect(() => {
        const subscription = errorDebounce.pipe(
            debounce(() => interval(1500))
        ).subscribe(error => onError((error && [error]) || []));

        return () => subscription.unsubscribe();
    }, [errorDebounce, onError]);

    useEffect(() => {
        propValue.current = value;
        const isObj = isObject(value);
        if (
            (isObj && value[Key] !== key) ||
            (!isObj && JSON.stringify(value) !== json)
        ) {
            const jsonValue = jsonStringify(value);

            setState({
                json: jsonValue,
                autoHeight: autoHeightFor(jsonValue)
            });
        }
    }, [value, json]);

    const clearCss = () => {
        if (css && css.length) {
            setState({ css: null });
        }
    };

    const handleChange = json => {
        const errorBeforeChange = error.current;
        let v;
        try {
            v = JSON.parse(json);
            error.current = null;
        } catch (e) {
            error.current = e.message;
        }
        if (error.current) {
            if (json === '' && (propValue.current === null || propValue.current === undefined)) {
                setState({ css: customCSS });
            } else {
                clearCss();
                if (errorBeforeChange) {
                    errorDebounce.next(error.current);
                } else {
                    onError([error.current]);
                }
            }
        } else {
            clearCss();
            if (isObject(v)) {
                v[Key] = key;
            }
            onChange(v);
            errorDebounce.next(null);
            onError([]);
        }
    };

    return (
        <CodeMirrorControl {...props}
                           lineNumbers={true}
                           addons={addons}
                           value={json}
                           gutters={gutters}
                           lint={true}
                           foldGutter={true}
                           onChange={handleChange}
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
