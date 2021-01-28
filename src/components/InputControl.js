import React from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import FilledInput from "@material-ui/core/FilledInput";
import reactiveControlFor from "./reactiveControlFor";

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
         type
     }) => (
        <FormControl variant="filled" fullWidth={true} disabled={disabled}>
            <InputLabel>{title}</InputLabel>
            <FilledInput key={dynamicKey}
                         type={type}
                         readOnly={readOnly}
                         error={error}
                         defaultValue={value}
                         onChange={e => onChange(e.target.value)}
                         onBlur={onBlur}
                         autoFocus={autoFocus}
                         onFocus={onFocus}
                         endAdornment={
                             !readOnly && !disabled && value !== undefined && value !== null &&
                             <InputAdornment position="end">
                                 <IconButton onClick={onClear}>
                                     <ClearIcon/>
                                 </IconButton>
                             </InputAdornment>
                         }
                         variant='filled'
            />
        </FormControl>
    )
);

export default InputControl;
