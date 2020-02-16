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
    Blur: 'Blur'
});

function reducer(state, { action, ...data }) {
    switch (action) {
        case Actions.CheckValue: {
            const { value } = data;
            if (state.value !== value) {
                return { ...state, value, key: Random.string() }
            }
        }
            break;

        case Actions.UpdateValue: {
            return { ...state, value: data.value };
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
    }

    return state;
}

function StringControl({ title, value, errors, disabled, readOnly, onDelete, onChange, parser }) {

    const [state, dispatch] = useReducer(reducer, {});

    useEffect(() => {
        dispatch({
            action: Actions.CheckValue,
            value
        });
    }, [value]);

    const handleChange = e => {
        const { value } = e.target;
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
        <FormControl variant="filled" fullWidth={true} disabled={disabled}>
            <InputLabel>{title}</InputLabel>
            <FilledInput key={key}
                         readOnly={readOnly}
                         error={error}
                         defaultValue={value}
                         onChange={handleChange}
                         onBlur={handleBlur}
                         autoFocus={autoFocus}
                         endAdornment={
                             !readOnly && !disabled && value !== undefined && value !== null &&
                             <InputAdornment position="end">
                                 <IconButton onClick={handleClear}>
                                     <ClearIcon/>
                                 </IconButton>
                             </InputAdornment>
                         }
                         variant='filled'
            />
        </FormControl>
    );
}

export default StringControl;
