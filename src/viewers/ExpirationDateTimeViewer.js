import React from 'react';
import Chip from "@material-ui/core/Chip";
import { formatDistanceToNow } from "date-fns";

export default function DateTimeViewer({ value, emptyMessage }) {
    let str;
    if (value === undefined || value === null) {
        if (emptyMessage) {
            return <Chip component="span" label={emptyMessage}/>;
        }
        str = '-';
    } else {
        const date = new Date(value);
        let msg = formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
        if (date < new Date()) {
            msg = `expired ${msg}`;
        } else {
            msg = `expires ${msg}`;
        }
        return <Chip component="span" label={msg}/>;
    }
    return <span>{str}</span>;
}
