import React from 'react';
import { format, isValid, parseISO } from "date-fns";

export default function DateTimeViewer({ value }) {
  if (!value) return <span>-</span>

  const cDate = new Date();
  const vDate = parseISO(value);
  if (!isValid(vDate)) return <span>-</span>;
  const pattern = vDate.getFullYear() === cDate.getFullYear() ? 'MMM d' : 'MMM d, yyyy';

  return <span>{format(vDate, pattern)}</span>;
}
