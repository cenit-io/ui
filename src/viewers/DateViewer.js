import React from 'react';
import moment from 'moment';

export default function DateTimeViewer({ value }) {
  if (!value) return <span>-</span>

  const cDate = moment();
  const vDate = moment(value);
  const format = vDate.year() === cDate.year() ? 'MMM D' : 'MMM D, YYYY';

  return <span>{vDate.format(format)}</span>;
}
