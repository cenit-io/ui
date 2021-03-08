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

function RefOneControl({
                           title, value, property, disabled, readOnly,
                           onChange, onDelete, onStack, config,
                           editDisabled, deleteDisabled, addDisabled, onPicked, additionalViewportProps
                       }) {

    const [state, setState] = useSpreadState({
        text: null
    });

    const { initialFormValue } = useFormContext();

    const { text } = state;

    useEffect(() => {
        const subscription = value.changed().pipe(
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
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value, property]);

    const refValue = value => {
        const { id, _type } = value;
        const refValue = {
            id,
            _reference: true
        };
        if (_type && _type !== property.dataType.type_name()) {
            refValue._type = _type;
        }
        if (additionalViewportProps) {
            additionalViewportProps.forEach(p => {
                if (value.hasOwnProperty(p)) {
                    refValue[p] = value[p];
                }
            })
        }
        return refValue;
    };

    const handlePick = ({ record, title }) => {
        const recordRef = refValue(record);
        recordRef[Title] = title;
        value.set(recordRef);
        value.changed().next(recordRef);
        onChange(recordRef);
        onPicked && onPicked(record);
    };

    const handleAddNew = () => {
        const newSeed = config?.newSeed;
        let seed;
        if (newSeed) {
            if (typeof newSeed === 'function') {
                seed = dataType => newSeed(value, dataType);
            } else {
                seed = newSeed;
            }
        }
        const customControlConfig = config?.formConfig;
        let controlConfig;
        if (customControlConfig) {
            if (typeof customControlConfig === 'function') {
                controlConfig = dataType => customControlConfig(dataType, value);
            } else {
                controlConfig = customControlConfig;
            }
        }
        onStack({
            value: new FormRootValue({ [FETCHED]: true }),
            seed,
            controlConfig,
            typesFilter: config.typesFilter,
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
    };

    const handleEdit = () => onStack({
        value: new FormRootValue(value.get()),
        dataType: property.dataType,
        controlConfig: config?.formConfig,
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
        setState({ text: '' });
    };

    let addButton, editButton, deleteButton;

    if (!disabled) {
        if (value.get()) {
            editButton = !editDisabled && (
                <IconButton onClick={handleEdit}
                            disabled={disabled}>
                    <EditIcon/>
                </IconButton>
            );
            if (!deleteDisabled && !readOnly) {
                deleteButton = (
                    <IconButton onClick={handleClear}
                                disabled={disabled}>
                        <ClearIcon/>
                    </IconButton>
                );
            }
        }

        if (!readOnly && !addDisabled) {
            addButton = (
                <IconButton onClick={handleAddNew}
                            disabled={disabled}>
                    <AddIcon/>
                </IconButton>
            );
        }
    }

    return (
        <div className="flex">
            <RefPicker dataType={property.dataType}
                       label={title}
                       onPick={handlePick}
                       text={text}
                       disabled={disabled || text === null}
                       readOnly={readOnly}
                       baseSelector={config?.selector}
                       additionalViewportProps={additionalViewportProps}/>
            {editButton}
            {addButton}
            {deleteButton}
        </div>
    );
}

export default RefOneControl;
