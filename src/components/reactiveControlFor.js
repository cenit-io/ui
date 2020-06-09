import React, { useEffect, useReducer, useState } from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Random from "../util/Random";
import FilledInput from "@material-ui/core/FilledInput";
import { Failed } from "../common/Symbols";

const Actions = Object.freeze({
    CheckValue: 'CheckValue',
    UpdateValue: 'UpdateValue',
    RefreshKey: 'RefreshKey',
    Blur: 'Blur',
    Focus: 'Focus'
});

function reducer(state, { action, ...data }) {
    switch (action) {
        case Actions.CheckValue: {
            const { value, validator, onError } = data;
            if (
                state.value !== value ||
                state.validator !== validator ||
                state.onError !== onError
            ) {
                return {
                    ...state,
                    value,
                    validator,
                    onError,
                    key: Random.string()
                }
            }
        }
            break;

        case Actions.UpdateValue: {
            const { validator, onError } = state;
            const { value } = data;

            const newState = { ...state, value: data.value };
            if (validator) {
                let errors = validator(value);
                if (errors) {
                    if (errors.constructor !== Array) {
                        errors = [errors];
                    }
                    onError(errors);
                    newState.hasErrors = true;
                } else if (newState.hasErrors) {
                    delete newState.hasErrors;
                    onError(null);
                }
            }

            return newState;
        }

        case Actions.RefreshKey: {
            return {
                ...state,
                key: Random.string(),
                autoFocus: data.autoFocus
            };
        }

        case Actions.Blur: {
            return {
                ...state,
                key: Random.string(),
                autoFocus: false
            };
        }

        case Actions.Focus: {
            return {
                ...state,
                autoFocus: true
            };
        }
    }

    return state;
}

const reactiveControlFor = Control => function (props) {

    const [state, dispatch] = useReducer(reducer, {});
    const { value, errors, onDelete, onChange, parser, validator, onError } = props;

    useEffect(() => {
        dispatch({
            action: Actions.CheckValue,
            value,
            validator,
            onError
        });
    }, [value, validator, onError]);

    const handleChange = value => {
        let parsedValue;
        if (parser) {
            parsedValue = parser(value);
        } else {
            parsedValue = value;
        }
        if (parsedValue === Failed) {
            dispatch({
                action: Actions.RefreshKey,
                autoFocus: true
            });
        } else {
            dispatch({
                action: Actions.UpdateValue,
                value: parsedValue
            });
            setTimeout(onChange(parsedValue));
        }
    };

    const handleClear = () => {
        onDelete();
        setTimeout(() => dispatch({
            action: Actions.RefreshKey
        }));
    };

    const handleBlur = () => dispatch({
        action: Actions.Blur
    });

    const { key, autoFocus } = state;

    const error = Boolean(errors && errors.length);

    return (
        <Control {...props}
                 dynamicKey={key}
                 error={error}
                 onChange={handleChange}
                 onBlur={handleBlur}
                 autoFocus={autoFocus}
                 onClear={handleClear}
                 onFocus={() => dispatch({
                     action: Actions.Focus
                 })}/>
    );
}

export default reactiveControlFor;
