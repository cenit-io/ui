import React from 'react';

export default function DateTimeViewer({ value }) {
    let str;
    if (value === undefined || value === null) {
        str = '-';
    } else {
        const date = new Date(value);
        const localeDate = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const localeTime = date.toLocaleTimeString('en-US');

        str = `${localeDate} ${localeTime}`;
    }
    return <span>{str}</span>;
}
