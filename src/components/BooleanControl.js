import React, {useState} from 'react';
import ClearIcon from '@material-ui/icons/Clear';
import BlankIcon from '@material-ui/icons/IndeterminateCheckBox';
import CheckedIcon from '@material-ui/icons/CheckBox';
import UncheckedIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import {FormControl, IconButton, Input, InputAdornment, InputLabel} from "@material-ui/core";

const BooleanControl = ({ title, onChange, value, onDelete }) => {

    const [over, setOver] = useState(false),

        CheckIcon = value === undefined ? BlankIcon : (value ? CheckedIcon : UncheckedIcon);

    return (
        <FormControl variant="filled" fullWidth={true}>
            <InputLabel>{title}</InputLabel>
            <Input disabled
                   onMouseEnter={() => setOver(true)}
                   onMouseLeave={() => setOver(false)}
                   endAdornment={
                       <InputAdornment position="end">
                           <IconButton onClick={() => onChange(!value)}>
                               <CheckIcon/>
                           </IconButton>
                           {
                               over && value !== undefined &&
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
