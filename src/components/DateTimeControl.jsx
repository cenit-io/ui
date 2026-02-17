import React, { useEffect, useState } from 'react';
import { IconButton } from "@mui/material";
import { useFormContext } from "./FormContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import ClearIcon from "@mui/icons-material/Clear";
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
                format={Formats.time} />
  );
}

function FormattedDate(props) {
  return (
    <DatePicker {...props}
                format="MMMM d, yyyy" />
  );
}

function FormattedDateTime(props) {
  return (
    <DateTimePicker {...props}
                    format="MMMM d, yyyy hh:mm aaaa" />
  );
}

export default function DateTimeControl(
  {
    title, onChange, value, onDelete, disabled, readOnly, schema, deleteDisabled, minDate
  }
) {

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

  let deleteButton;
  if (!readOnly && date && !disabled && !deleteDisabled) {
    deleteButton = (
      <IconButton onClick={handleDelete} size="large">
        <ClearIcon />
      </IconButton>
    );
  }

  const Control = schema.format === 'date'
    ? FormattedDate
    : (schema.format === 'time'
      ? FormattedTime
      : FormattedDateTime);

  return (
    <div className="flex align-items-center full-width">
      <Control value={date}
               onChange={handleChange}
               disabled={disabled}
               readOnly={readOnly}
               minDate={minDate}
               slotProps={{
                 textField: {
                   className: "full-width",
                   variant: "filled",
                   label: title,
                   placeholder: title
                 }
               }} />
      {deleteButton}
    </div>
  );
};
