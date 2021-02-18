import React from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import FilledInput from "@material-ui/core/FilledInput";
import reactiveControlFor from "./reactiveControlFor";
import Input from "@material-ui/core/Input";
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
         variant
     }) => {
        if (variant !== 'outlined') {
            variant = 'filled';
        }

        const InputControl = variant === 'outlined'
            ? OutlinedInput
            : FilledInput;

        return (
            <FormControl fullWidth disabled={disabled}>
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
                              endAdornment={
                                  !readOnly && !disabled && value !== undefined && value !== null &&
                                  <InputAdornment position="end">
                                      <IconButton onClick={onClear}>
                                          <ClearIcon/>
                                      </IconButton>
                                  </InputAdornment>
                              }
                              variant='filled'/>
            </FormControl>
        );
    }
);

export default InputControl;
