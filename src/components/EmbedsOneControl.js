import React, { useEffect } from 'react';
import { IconButton, TextField } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl from "./ObjectControl";
import '../common/FlexBox.css';
import { map, switchMap } from "rxjs/operators";
import { FETCHED, NEW } from "../common/Symbols";
import { of } from "rxjs";
import Random from "../util/Random";
import { useSpreadState } from "../common/hooks";
import { useFormContext } from "./FormContext";

function PlaceHolder({ value, property, label, error, className }) {
    const [state, setState] = useSpreadState({
        key: Random.string(),
        valueTitle: ''
    });

    const { valueTitle, key } = state;

    useEffect(() => {
        setState({ key: Random.string() });

        let obs = value.changed().pipe(
            switchMap(
                v => (v && property.dataType.straightTitleFor(v)) || of('')
            )
        );

        const subscription = obs.subscribe(valueTitle => setState({ valueTitle }));

        obs.next(value.get());

        return () => subscription.unsubscribe();
    }, [value, property]);

    return (
        <TextField key={key}
                   label={label}
                   readOnly
                   className={className}
                   value={valueTitle}
                   placeholder={valueTitle || (!value.get() && String(value.cache)) || valueTitle}
                   error={error}/>
    );
}

function EmbedsOneControl({ title, value, errors, property, onDelete, onChange, width, disabled, onStack, readOnly }) {

    const [state, setState] = useSpreadState();

    const { initialFormValue } = useFormContext();

    const { open } = state;

    const setOpen = open => setState({ open });

    useEffect(() => {
        if (!value.get()) {
            setState({ open: false });
        }
    }, [value]);

    const addNew = () => {
        const v = { [FETCHED]: true, [NEW]: true };
        value.set(v);
        onChange(v);
        setTimeout(() => setOpen(true));
    };

    const handleStack = item => onStack({
        ...item,
        title: itemValue => item.title(itemValue).pipe(
            switchMap(itemTitle => property.dataType.titleFor(value.get()).pipe(
                map(title => `[${property.name}] ${title} ${itemTitle}`)
            )))
    });

    const handleDelete = () => {
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue !== null && initialValue !== undefined) {
            value.set(null);
        } else {
            value.delete();
        }
        value.checkPid();
        setOpen(false);
        onDelete();
    };

    let objectControl, actionButton, deleteButton;

    if (value.get()) {
        if (open) {
            objectControl = <ObjectControl property={property}
                                           value={value}
                                           errors={errors}
                                           onChange={onChange}
                                           width={width}
                                           disabled={disabled}
                                           readOnly={readOnly}
                                           onStack={handleStack}/>;
            actionButton =
                <IconButton onClick={() => setOpen(false)} disabled={disabled}><ArrowDropUpIcon/></IconButton>;
        } else {
            actionButton =
                <IconButton onClick={() => setOpen(true)} disabled={disabled}><ArrowDropDownIcon/></IconButton>;
        }
        if (!readOnly) {
            deleteButton = <IconButton onClick={handleDelete} disabled={disabled}><ClearIcon/></IconButton>;
        }
    } else if (!readOnly) {
        actionButton = <IconButton onClick={addNew} disabled={disabled}><AddIcon/></IconButton>;
    }

    return (
        <div className='flex full-width column'>
            <div className='flex full-width'>
                <PlaceHolder value={value}
                             property={property}
                             label={title}
                             className='grow-1'
                             error={(errors && Object.keys(errors).length > 0) || false}/>
                {actionButton}
                {deleteButton}
            </div>
            {objectControl}
        </div>
    );
}

export default EmbedsOneControl;
