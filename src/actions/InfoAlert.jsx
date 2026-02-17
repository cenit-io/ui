import React from "react";
import Alert from "./Alert";
import InfoIcon from '@mui/icons-material/Info';
import { useTheme } from '@mui/material/styles';


export default function InfoAlert(
  {
    title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background
  }
) {

  const theme = useTheme();

  smallIcon = smallIcon || InfoIcon;
  smallIconColor = smallIconColor || theme.palette.info.main;
  background = background || theme.palette.info.light;

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
