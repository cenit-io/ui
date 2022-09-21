import React from 'react';

export default function EnumViewer({ prop, value }) {

  const { enum: enumValues, enumNames } = prop.propertySchema;

  if (enumNames) {
    value = enumNames[enumValues.indexOf(value)] || value;
  }

  return <span>{value || '-'}</span>;
}
