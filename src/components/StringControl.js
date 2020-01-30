import React, { useEffect, useReducer, useState } from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Random from "../util/Random";
import FilledInput from "@material-ui/core/FilledInput";

const Actions = Object.freeze({
    CheckValue: 'CheckValue',
    UpdateValue: 'UpdateValue',
    RefreshKey: 'RefreshKey'
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
            return { ...state, key: Random.string() };
        }
    }

    return state;
}

function StringControl({ title, value, errors, disabled, readOnly, onDelete, onChange }) {

    const [state, dispatch] = useReducer(reducer, {});

    useEffect(() => {
        dispatch({
            action: Actions.CheckValue,
            value
        });
    }, [value]);

    const handleChange = e => {
        const { value } = e.target;
        dispatch({
            action: Actions.UpdateValue,
            value
        });
        setTimeout(onChange(value));
    };

    const handleClear = () => {
        onDelete();
        setTimeout(() => dispatch({
            action: Actions.RefreshKey
        }));
    };

    const { key } = state;

    const error = Boolean(errors && errors.length);

    return (
        <FormControl variant="filled" fullWidth={true} disabled={disabled}>
            <InputLabel>{title}</InputLabel>
            <FilledInput key={key}
                         readOnly={readOnly}
                         error={error}
                         defaultValue={value}
                         onChange={handleChange}
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
