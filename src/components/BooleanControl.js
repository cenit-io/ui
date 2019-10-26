import React, {useState} from 'react';
import ClearIcon from '@material-ui/icons/Clear';
import BlankIcon from '@material-ui/icons/IndeterminateCheckBox';
import CheckedIcon from '@material-ui/icons/CheckBox';
import UncheckedIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import {FormControl, IconButton, Input, InputAdornment, InputLabel} from "@material-ui/core";

const BooleanControl = ({ title, onChange, value, onDelete, disabled }) => {

    const CheckIcon = value === undefined ? BlankIcon : (value ? CheckedIcon : UncheckedIcon);

    return (
        <FormControl variant="filled" fullWidth={true} disabled={disabled}>
            <InputLabel>{title}</InputLabel>
            <Input disabled
                   endAdornment={
                       <InputAdornment position="end">
                           <IconButton onClick={() => onChange(!value)} disabled={disabled}>
                               <CheckIcon/>
                           </IconButton>
                           {
                               !disabled && value !== undefined &&
                               <IconButton onClick={onDelete}>
                                   <ClearIcon/>
                               </IconButton>
                           }
                       </InputAdornment>
                   }
            />
        </FormControl>
    );
};

export default BooleanControl;
