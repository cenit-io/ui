import React, { useState } from 'react';
import { IconButton, TextField } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl from "./ObjectControl";
import '../util/FlexBox.css'

function EmbedsOneControl({ title, value, errors, property, onDelete, onChange, width, disabled, onStack }) {

    const [valueTitle, setValueTitle] = useState('');
    const [open, setOpen] = useState(false);

    const addNew = () => {
        onChange({});
        setTimeout(() => setOpen(true));
    };

    const handleStack = item => onStack({
        ...item,
        title: async itemValue => `[${property.name}] ${await property.dataType.titleFor(value)} ${await item.title(itemValue)}`
    });

    let objectControl, actionButton, deleteButton;

    if (value) {
        property.dataType.titleFor(value).then(t => setValueTitle(t));
        if (open) {
            objectControl = <ObjectControl property={property}
                                           value={value}
                                           errors={errors}
                                           onChange={onChange}
                                           width={width}
                                           disabled={disabled}
                                           onStack={handleStack}/>;
            actionButton =
                <IconButton onClick={() => setOpen(false)} disabled={disabled}><ArrowDropUpIcon/></IconButton>;
        } else {
            actionButton =
                <IconButton onClick={() => setOpen(true)} disabled={disabled}><ArrowDropDownIcon/></IconButton>;
        }
        deleteButton = <IconButton onClick={onDelete} disabled={disabled}><ClearIcon/></IconButton>;
    } else {
        valueTitle.length && setValueTitle('');
        actionButton = <IconButton onClick={addNew} disabled={disabled}><AddIcon/></IconButton>;
    }

    return (
        <div className='flex full-width column'>
            <div className='flex full-width'>
                <TextField label={title}
                           disabled={true}
                           className='grow-1'
                           value={valueTitle}
                           error={(errors && Object.keys(errors).length > 0) || false}/>
                {actionButton}
                {deleteButton}
            </div>
            {objectControl}
        </div>
    );
}

export default EmbedsOneControl;
