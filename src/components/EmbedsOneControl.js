import React, {useState} from 'react';
import {IconButton, TextField} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl from "./ObjectControl";
import './FlexBox.css'

function EmbedsOneControl({ title, value, errors, property, onDelete, onChange, width }) {

    const [open, setOpen] = useState(false),

        addNew = () => {
            onChange({});
            setTimeout(() => setOpen(true));
        };

    let objectControl, actionButton, deleteButton;

    if (value) {
        if (open) {
            objectControl = <ObjectControl property={property}
                                           value={value}
                                           errors={errors}
                                           onChange={onChange}
                                           width={width}/>;
            actionButton = <IconButton onClick={() => setOpen(false)}><ArrowDropUpIcon/></IconButton>;
        } else {
            actionButton = <IconButton onClick={() => setOpen(true)}><ArrowDropDownIcon/></IconButton>;
        }
        deleteButton = <IconButton onClick={onDelete}><ClearIcon/></IconButton>;
    } else {
        actionButton = <IconButton onClick={addNew}><AddIcon/></IconButton>;
    }

    return (
        <div className='flex full-width column'>
            <div className='flex full-width'>
                <TextField label={title} disabled={true} style={{flexGrow: 1}}/>
                {actionButton}
                {deleteButton}
            </div>
            {objectControl}
        </div>
    );
}

export default EmbedsOneControl;
