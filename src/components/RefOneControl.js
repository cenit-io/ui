import React, { useEffect } from 'react';
import { IconButton } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import RefPicker from "./RefPicker";
import { map, switchMap } from "rxjs/operators";
import { useSpreadState } from "../common/hooks";
import { FormRootValue } from "../services/FormValue";
import { of } from "rxjs";
import { FETCHED, Title } from "../common/Symbols";
import { useFormContext } from "./FormContext";

function RefOneControl({ title, value, property, disabled, readOnly, onChange, onDelete, onStack, config }) {

    const [state, setState] = useSpreadState({
        text: null
    });

    const { initialFormValue } = useFormContext();

    const { text } = state;

    useEffect(() => {
        const obs = value.changed();
        const subscription = obs.pipe(
            switchMap(v => {
                if (v) {
                    const title = v[Title];
                    if (title) {
                        return of(title);
                    }
                    return property.dataType.titleFor(v);
                }
                return of('');
            })
        ).subscribe(
            text => setState({ text })
        );
        obs.next(value.get());
        return () => subscription.unsubscribe();
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

    const handlePick = ({ record, title }) => {
        record = refValue(record);
        record[Title] = title;
        value.set(record);
        value.changed().next(record);
        onChange(record);
    };

    const handleAddNew = () => onStack({
        value: new FormRootValue({ [FETCHED]: true }),
        dataType: property.dataType,
        title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
        callback: newValue => {
            property.dataType.titleFor(newValue).subscribe(
                title => {
                    newValue = refValue(newValue);
                    newValue[Title] = title;
                    value.set(newValue);
                    value.changed().next(newValue);
                    onChange(newValue);
                }
            );
        },
        max: 1
    });

    const handleEdit = () => onStack({
        value: new FormRootValue(value.get()),
        dataType: property.dataType,
        title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
        callback: newValue => {
            property.dataType.titleFor(newValue).subscribe(
                title => {
                    newValue = refValue(newValue);
                    newValue[Title] = title;
                    value.set(newValue);
                    value.changed().next(newValue);
                    onChange(newValue);
                }
            );
        },
        rootId: value.cache.id
    });

    const handleClear = () => {
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue) {
            value.set(null);
        } else {
            value.delete();
        }
        onDelete();
        setState({}); // to refresh
    };

    let addButton, editButton, deleteButton;

    if (value.get()) {
        editButton = (
            <IconButton onClick={handleEdit}
                        disabled={disabled}>
                <EditIcon/>
            </IconButton>
        );
        if (!readOnly) {
            deleteButton = (
                <IconButton onClick={handleClear}
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
