import React, { useEffect, useState } from 'react';
import { IconButton, InputAdornment } from "@material-ui/core";
import { useFormContext } from "./FormContext";
import { DatePicker, DateTimePicker, TimePicker } from "@material-ui/pickers";
import CalendarIcon from "@material-ui/icons/Event";
import ClearIcon from "@material-ui/icons/Clear";

export default function DateTimeControl({ title, onChange, value, onDelete, disabled, readOnly, schema }) {

    const [date, setDate] = useState(null);

    const { initialFormValue } = useFormContext();

    useEffect(() => {
        const subscription = value.changed().subscribe(
            date => setDate(date || null)
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value]);

    const handleChange = date => {
        setDate(date);
        if (!date || !isNaN(date?.getDate())) {
            date = date?.toISOString();
            value.set(date);
            onChange(date);
        }
    };

    const handleDelete = e => {
        e?.stopPropagation();
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue !== null && initialValue !== undefined) {
            value.set(null);
        } else {
            value.delete();
        }
        setDate(null);
        onDelete();
    };

    let pickButton, deleteButton;
    if (!readOnly) {
        pickButton = (
            <IconButton>
                <CalendarIcon/>
            </IconButton>
        );
        if (date && !disabled) {
            deleteButton = (
                <IconButton onClick={handleDelete}>
                    <ClearIcon/>
                </IconButton>
            );
        }
    }

    const Control = schema.format === 'date'
        ? DatePicker
        : (schema.format === 'time'
            ? TimePicker
            : DateTimePicker);

    return (
        <Control className="full-width"
                 clearable
                 value={date}
                 onChange={handleChange}
                 disabled={disabled}
                 readOnly={readOnly}
                 placeholder={title}
                 label={title}
                 variant="inline"
                 inputVariant="filled"
                 InputProps={{
                     endAdornment: (
                         <InputAdornment position="end">
                             {pickButton}
                             {deleteButton}
                         </InputAdornment>
                     ),
                 }}/>
    );
};
