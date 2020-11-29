import React, { useEffect, useState } from 'react';
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { useFormContext } from "./FormContext";
import { Config } from "../common/Symbols";

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

export default function EnumInput({
                                      title,
                                      value,
                                      disabled,
                                      readOnly,
                                      error,
                                      onChange,
                                      property
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

    useEffect(() => {
        const enumOptions = property.propertySchema.enum;
        if (!enumOptions[Config]) {
            const config = enumOptions[Config] = {};
            const { enumNames } = property.propertySchema;
            enumOptions.forEach(
                (option, index) => config[option] = (enumNames && enumNames[index]) || `${option}`
            );
        }
    }, [property]);

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

    return <Autocomplete options={property.propertySchema.enum}
                         getOptionLabel={option => property.propertySchema.enum[Config][option]}
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
