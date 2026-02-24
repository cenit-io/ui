import React, { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from "@mui/material/TextField";
import { useFormContext } from "./FormContext";

export default function AutocompleteControl({
  title,
  value,
  disabled,
  readOnly,
  error,
  onChange,
  options,
  freeSolo,
  deleteDisabled,
  multiple,
  formatter,
  parser,
  renderTags
}) {
  const [state, setState] = useState(multiple ? [] : null);

  const { initialFormValue } = useFormContext();

  useEffect(() => {
    if (multiple) {
      setState(state => state === null ? [] : [state]);
    } else {
      setState(state => (state && state[0]) || null);
    }
  }, [multiple]);

  useEffect(() => {
    const subscription = value.changed().subscribe(
      v => {
        if (parser) {
          v = parser(v);
        }
        setState(v || (multiple ? [] : null));
      }
    );
    value.changed().next(value.get());
    return () => subscription.unsubscribe();
  }, [value, parser]);

  const optionLabel = key => options && options.constructor === Object
    ? options[key]
    : key;

  if (readOnly && !multiple) {
    return <TextField key={`readOnly_${state}`}
                      label={title}
                      value={optionLabel(state) || ''}
                      className="full-width"
                      variant="filled"
                      InputProps={{ readOnly, error }} />;
  }

  const handleChange = (_, v) => {
    const formattedValue = formatter
      ? formatter(v)
      : v;
    if (v === null || (multiple && !v.length)) {
      const initialValue = value.valueFrom(initialFormValue);
      if (initialValue !== undefined && initialValue !== null) {
        value.set(null);
      } else {
        value.delete();
      }
    } else {
      value.set(formattedValue);
    }
    onChange && onChange(formattedValue);
    setState(v || (multiple ? [] : v));
  };

  const selectableOptions = options
    ? (options.constructor === Array
      ? options
      : Object.keys(options))
    : [];

  return <Autocomplete multiple={multiple}
                       renderTags={renderTags}
                       options={selectableOptions}
                       freeSolo={freeSolo}
                       getOptionLabel={optionLabel}
                       disabled={disabled}
                       value={state}
                       onChange={handleChange}
                       disableClearable={deleteDisabled || readOnly}
                       sx={{
                         '& .MuiAutocomplete-endAdornment': {
                           top: theme => theme.spacing(0.5),
                           paddingRight: theme => theme.spacing(0.5),
                           '& .MuiAutocomplete-clearIndicator': {
                             float: 'right',
                             display: state ? 'inherit' : 'none',
                             visibility: state ? 'inherit' : 'hidden',
                             '& .MuiSvgIcon-root': {
                               fontSize: 'inherit'
                             }
                           }
                         }
                       }}
                       renderInput={
                         params => <TextField {...params}
                                              readOnly={readOnly}
                                              error={error}
                                              label={title}
                                              variant="filled"
                                              className="full-width" />
                       } />;
}
