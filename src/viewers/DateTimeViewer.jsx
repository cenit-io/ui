import React from 'react';
import moment from 'moment';

export default function DateTimeViewer({ value }) {
  if (!value) return <span>-</span>

  const cDate = moment();
  const vDate = moment(value);
  const format = vDate.year() === cDate.year() ? 'MMM D, HH:mm:ss' : 'MMM D, YYYY, HH:mm:ss';

  return <span>{vDate.format(format)}</span>;
}
