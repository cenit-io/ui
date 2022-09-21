import React from 'react';
import prettyBytes from 'pretty-bytes';

export default function FileSizeViewer({ value }) {
  return <span>{prettyBytes(value)}</span>;
}
