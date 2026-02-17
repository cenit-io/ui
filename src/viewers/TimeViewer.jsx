import React from 'react';
import moment from 'moment';

export default function DateTimeViewer({ value }) {
  if (!value) return <span>-</span>

  const vDate = moment(value, value.match(/PM|AM/i) ? 'hh:mm:ss a' : 'HH:mm:ss');

  return <span>{vDate.format('HH:mm:ss')}</span>;
}
