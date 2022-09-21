import React from 'react';

export default function JsonViewer({ value }) {
  return <span>{JSON.stringify(value)}</span>;
}
