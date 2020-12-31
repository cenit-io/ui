import React from 'react';

export default function StringViewer({ value }) {
    const str = (value === undefined || value === null)
        ? '-'
        : String(value);

    return <span>{str}</span>;
}
