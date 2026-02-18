import React from 'react';
import { useTheme } from '@mui/material/styles';
import NotDefinedIcon from "../icons/NotDefinedIcon";
import CheckIcon from "../icons/CheckIcon";
import FalseIcon from "../icons/FalseIcon";

export const useBooleanViewerStyles = () => {
  const theme = useTheme();
  return {
    true: theme.palette.success.main,
    false: theme.palette.error.main,
    undefined: theme.palette.text.secondary,
    null: theme.palette.text.secondary,
  };
};

export default function BooleanViewer({ value }) {
  const colors = useBooleanViewerStyles();

  const Icon = value === undefined || value === null
    ? NotDefinedIcon
    : (value ? CheckIcon : FalseIcon);

  const iconColor = colors[String(value)];

  return <Icon style={{ color: iconColor }} fontSize="small" />;
}
