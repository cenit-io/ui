import React from "react";
import Alert from "./Alert";
import InfoIcon from '@material-ui/icons/Info';
import useTheme from "@material-ui/core/styles/useTheme";


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
