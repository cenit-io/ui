import React, { useEffect, useState } from 'react';
import { IconButton, InputAdornment } from "@material-ui/core";
import { useFormContext } from "./FormContext";
import { DatePicker, DateTimePicker, TimePicker } from "@material-ui/pickers";
import CalendarIcon from "@material-ui/icons/Event";
import ClearIcon from "@material-ui/icons/Clear";
import { format } from 'date-fns';

const Formats = {
    date: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    time: 'HH:mm:ss.SSSxxx'
};

function FormattedTime(props) {
    return (
        <TimePicker {...props}
                    openTo="hours"
                    views={["hours", "minutes", "seconds"]}
                    format={Formats.time}/>
    );
}

function FormattedDate(props) {
    return (
        <DatePicker {...props}
                    format="MMMM d, yyyy"/>
    );
}

function FormattedDateTime(props) {
    return (
        <DateTimePicker {...props}
                        format="MMMM d, yyyy hh:mm aaaa"/>
    );
}

export default function DateTimeControl({ title, onChange, value, onDelete, disabled, readOnly, schema }) {

    const [date, setDate] = useState(null);

    const { initialFormValue } = useFormContext();

    useEffect(() => {
        const subscription = value.changed().subscribe(
            date => {
                if (date && schema.format === 'time') {
                    date = `${format(new Date(), 'yyyy-MM-dd')}T${date}`;
                }
                setDate(date || null);
            }
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value, schema]);

    const handleChange = date => {
        setDate(date);
        if (!date || !isNaN(date?.getDate())) {
            const dateFormat = Formats[schema.format];
            if (dateFormat) {
                date = format(date, dateFormat);
            } else {
                date = date?.toISOString();
            }
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
        ? FormattedDate
        : (schema.format === 'time'
            ? FormattedTime
            : FormattedDateTime);

    return (
        <Control className="full-width"
                 clearable
                 value={date}
                 onChange={handleChange}
                 disabled={disabled}
                 readOnly={readOnly}
                 placeholder={title}
                 label={title}
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
