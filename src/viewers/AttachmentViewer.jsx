import React from 'react';
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";

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
