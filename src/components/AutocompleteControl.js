import React, { useEffect, useState } from 'react';
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { useFormContext } from "./FormContext";

const useStyles = makeStyles(theme => ({
    root: {
        '& .MuiAutocomplete-endAdornment': {
            top: theme.spacing(0.5),
            paddingRight: theme.spacing(0.5),
            '& .MuiAutocomplete-clearIndicator': {
                float: 'right',
                display: 'none',
                '& .MuiSvgIcon-root': {
                    fontSize: 'inherit'
                }
            }
        }
    },
    clearable: {
        '& .MuiAutocomplete-endAdornment': {
            top: theme.spacing(0.5),
            paddingRight: theme.spacing(0.5),
            '& .MuiAutocomplete-clearIndicator': {
                display: 'inherit',
                visibility: 'inherit'
            }
        }
    }
}));

export default function AutocompleteControl({
                                                title,
                                                value,
                                                disabled,
                                                readOnly,
                                                error,
                                                onChange,
                                                options,
                                                freeSolo
                                            }) {
    const [state, setState] = useState(null);
    const classes = useStyles();

    const { initialFormValue } = useFormContext();

    useEffect(() => {
        const subscription = value.changed().subscribe(
            v => setState(v || null)
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value]);

    const optionLabel = key => options && options.constructor === Object
        ? options[key]
        : key;

    if (readOnly) {
        return <TextField key={`readOnly_${state}`}
                          label={title}
                          value={optionLabel(state) || ''}
                          className="full-width"
                          variant="filled"
                          InputProps={{ readOnly, error }}/>;
    }

    const handleChange = (_, v) => {
        if (v === null) {
            const initialValue = value.valueFrom(initialFormValue);
            if (initialValue !== undefined && initialValue !== null) {
                value.set(null);
            } else {
                value.delete();
            }
        } else {
            value.set(v);
        }
        onChange && onChange(v);
        setState(v);
    };

    const selectableOptions = options
        ? (options.constructor === Array
            ? options
            : Object.keys(options))
        : [];

    return <Autocomplete options={selectableOptions}
                         freeSolo={freeSolo}
                         getOptionLabel={optionLabel}
                         disabled={disabled}
                         value={state}
                         onChange={handleChange}
                         renderInput={
                             params => <TextField {...params}
                                                  readOnly={readOnly}
                                                  error={error}
                                                  label={title}
                                                  variant="filled"
                                                  className={clsx(
                                                      classes.root,
                                                      state && classes.clearable
                                                  )}/>
                         }/>;
}
