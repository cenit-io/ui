import React, { useState } from 'react';
import { IconButton, TextField } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl, { FETCHED } from "./ObjectControl";
import '../util/FlexBox.css';
import { map, switchMap } from "rxjs/operators";

function EmbedsOneControl({ rootDataType, jsonPath, title, value, errors, property, onDelete, onChange, width, disabled, onStack, rootId }) {

    const [isEdit, setEdit] = useState(value);
    const [valueTitle, setValueTitle] = useState('');
    const [open, setOpen] = useState(false);

    const addNew = () => {
        onChange({ [FETCHED]: true });
        setTimeout(() => setOpen(true));
    };

    const handleStack = item => onStack({
        ...item,
        title: itemValue => item.title(itemValue).pipe(
            switchMap(itemTitle => property.dataType.titleFor(value).pipe(
                map(title => `[${property.name}] ${title} ${itemTitle}`)
            )))
    });

    const handleDelete = () => {
        setEdit(false);
        onDelete();
    };

    let objectControl, actionButton, deleteButton;

    if (value) {
        property.dataType.titleFor(value).subscribe(t => {
            if (t !== valueTitle) { //TODO Use efects
                setValueTitle(t);
            }
        });
        if (open) {
            objectControl = <ObjectControl rootDataType={rootDataType}
                                           jsonPath={jsonPath}
                                           property={property}
                                           value={value}
                                           errors={errors}
                                           onChange={onChange}
                                           width={width}
                                           disabled={disabled}
                                           onStack={handleStack}
                                           rootId={isEdit ? rootId : null}/>;
            actionButton =
                <IconButton onClick={() => setOpen(false)} disabled={disabled}><ArrowDropUpIcon/></IconButton>;
        } else {
            actionButton =
                <IconButton onClick={() => setOpen(true)} disabled={disabled}><ArrowDropDownIcon/></IconButton>;
        }
        deleteButton = <IconButton onClick={handleDelete} disabled={disabled}><ClearIcon/></IconButton>;
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
