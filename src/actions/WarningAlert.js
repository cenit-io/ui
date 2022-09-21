import React from "react";
import Alert from "./Alert";
import WarningIcon from '@material-ui/icons/Info';
import useTheme from "@material-ui/core/styles/useTheme";


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
