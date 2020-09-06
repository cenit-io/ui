import React, { useEffect, useReducer } from 'react';
import { IconButton } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import RefPicker from "./RefPicker";
import { map } from "rxjs/operators";
import spreadReducer from "../common/spreadReducer";

function RefOneControl({ title, value, property, disabled, readOnly, onChange, onDelete, onStack, config }) {

    const [state, setState] = useReducer(spreadReducer, {
        text: null
    });

    const { text, item } = state;

    useEffect(() => {
        if (value) {
            setState({ text: null });
            const subscription = property.dataType.titleFor(value).subscribe(
                text => setState({ text })
            );
            return () => subscription.unsubscribe();
        } else {
            setState({ text: '' });
        }
    }, [value, property]);

    const refValue = ({ id, _type }) => {
        const value = {
            id,
            _reference: true
        };
        if (_type && _type !== property.dataType.type_name()) {
            value._type = _type;
        }
        return value;
    };

    const handlePick = item => {
        const value = refValue(item.record);
        onChange(value);
        setState({ value, text: item.title, item: item.record });
    };

    const handleAddNew = () => onStack({
        value: {},
        dataType: property.dataType,
        title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
        callback: newValue => onChange(refValue(newValue)),
        max: 1
    });

    const handleEdit = () => onStack({
        value: item || value,
        dataType: property.dataType,
        title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
        callback: newValue => onChange(refValue(newValue)),
        rootId: value.id
    });

    let addButton, editButton, deleteButton;

    if (value) {
        editButton = (
            <IconButton onClick={handleEdit}
                        disabled={disabled}>
                <EditIcon/>
            </IconButton>
        );
        if (!readOnly) {
            deleteButton = (
                <IconButton onClick={onDelete}
                            disabled={disabled}>
                    <ClearIcon/>
                </IconButton>
            );
        }
    }

    if (!readOnly) {
        addButton = (
            <IconButton onClick={handleAddNew}
                        disabled={disabled}>
                <AddIcon/>
            </IconButton>
        );
    }

    return (
        <div className="flex">
            <RefPicker dataType={property.dataType}
                       label={title}
                       onPick={handlePick}
                       text={text}
                       disabled={disabled || text === null}
                       readOnly={readOnly}
                       baseSelector={config?.selector}/>
            {editButton}
            {addButton}
            {deleteButton}
        </div>
    );
}

export default RefOneControl;
