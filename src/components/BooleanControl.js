import React, { useState } from 'react';
import ClearIcon from '@material-ui/icons/Clear';
import BlankIcon from '@material-ui/icons/IndeterminateCheckBox';
import CheckedIcon from '@material-ui/icons/CheckBox';
import UncheckedIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { FormControl, IconButton, FilledInput, InputAdornment, InputLabel } from "@material-ui/core";

const BooleanControl = ({ title, onChange, value, onDelete, disabled }) => {
    const [focused, setFocused] = useState(false);
    const CheckIcon = value === undefined || value === null ? BlankIcon : (value ? CheckedIcon : UncheckedIcon);
    const displayValue = String(value);

    const handleChange = () => {
        setFocused(true);
        onChange(!value);
    };

    const handleDelete = () => {
        setFocused(true);
        onDelete();
    };

    return (
        <FormControl variant="filled" fullWidth={true} disabled={disabled}>
            <InputLabel>{title}</InputLabel>
            <FilledInput key={displayValue}
                         readOnly
                         value={focused ? displayValue : ''}
                         autoFocus={focused}
                         endAdornment={
                             <InputAdornment position="end">

                                 <IconButton onClick={handleChange} disabled={disabled}>
                                     <CheckIcon color={focused ? 'primary' : 'inherit'}/>
                                 </IconButton>
                                 {
                                     !disabled && value !== undefined && value !== null &&
                                     <IconButton onClick={handleDelete}>
                                         <ClearIcon/>
                                     </IconButton>
                                 }
                             </InputAdornment>
                         }
                         onFocus={() => setFocused(true)}
                         onBlur={() => setFocused(false)}
            />
        </FormControl>
    );
};

export default BooleanControl;
