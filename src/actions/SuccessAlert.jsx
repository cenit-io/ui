import React from "react";
import Alert from "./Alert";
import SuccessIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';


export default function SuccessAlert(
  {
    title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background
  }
) {

  const theme = useTheme();

  smallIcon = smallIcon || SuccessIcon;
  smallIconColor = smallIconColor || theme.palette.success.main;
  background = background || theme.palette.success.light;

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

export const SuccessAlertWith = props => () => <SuccessAlert {...props} />;
