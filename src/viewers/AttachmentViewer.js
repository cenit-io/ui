import React from 'react';
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

const stopPropagation = e => e.stopPropagation();

export default function AttachmentViewer({ value, className }) {
    const url = value?.url;

    if (url) {
        const filename = url.split('/').pop();

        return (
            <Link className={className}
                  href={url} target="_blank"
                  onClick={stopPropagation}>
                {filename}
            </Link>
        )
    }

    return <span className={className}>-</span>;
}
