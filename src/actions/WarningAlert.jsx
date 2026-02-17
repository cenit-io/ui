import React from "react";
import Alert from "./Alert";
import WarningIcon from '@mui/icons-material/Info';
import { useTheme } from '@mui/material/styles';


export default function WarningAlert(
  {
    title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background
  }
) {

  const theme = useTheme();

  smallIcon = smallIcon || WarningIcon;
  smallIconColor = smallIconColor || theme.palette.warning.main;
  background = background || theme.palette.warning.light;

  return (
    <Alert title={title}
           message={message}
           mainIconColor={mainIconColor}
           smallIcon={smallIcon}
           smallIconColor={smallIconColor}
           background={background}
           mainIcon={mainIcon}>
      {children}
    </Alert>
  );
}
