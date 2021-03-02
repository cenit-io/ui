import React from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import FilledInput from "@material-ui/core/FilledInput";
import reactiveControlFor from "./reactiveControlFor";
import OutlinedInput from "@material-ui/core/OutlinedInput";

const InputControl = reactiveControlFor(
    ({
         title,
         value,
         disabled,
         readOnly,
         dynamicKey,
         error,
         onChange,
         onBlur,
         autoFocus,
         onFocus,
         onClear,
         type,
         multiline,
         variant,
         autoComplete
     }) => {
        if (variant !== 'outlined') {
            variant = 'filled';
        }

        const InputControl = variant === 'outlined'
            ? OutlinedInput
            : FilledInput;

        return (
            <FormControl fullWidth disabled={disabled} component="div">
                <InputLabel htmlFor={dynamicKey} variant={variant}>{title}</InputLabel>
                <InputControl key={dynamicKey}
                              id={dynamicKey}
                              label={title}
                              type={type}
                              readOnly={readOnly}
                              error={error}
                              defaultValue={value}
                              onChange={e => onChange(e.target.value)}
                              onBlur={onBlur}
                              autoFocus={autoFocus}
                              onFocus={onFocus}
                              multiline={multiline}
                              autoComplete={autoComplete}
                              endAdornment={
                                  !readOnly && !disabled && value !== undefined && value !== null &&
                                  <InputAdornment position="end" component="div">
                                      <IconButton onClick={onClear}>
                                          <ClearIcon/>
                                      </IconButton>
                                  </InputAdornment>
                              }
                              variant={variant}/>
            </FormControl>
        );
    }
);

export default InputControl;
