import React from 'react';
import { format, isValid, parse } from "date-fns";

export default function DateTimeViewer({ value }) {
  if (!value) return <span>-</span>

  const pattern = value.match(/PM|AM/i) ? 'hh:mm:ss a' : 'HH:mm:ss';
  const vDate = parse(value, pattern, new Date());
  if (!isValid(vDate)) return <span>-</span>;

  return <span>{format(vDate, 'HH:mm:ss')}</span>;
}
