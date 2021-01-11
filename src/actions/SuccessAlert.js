import React from "react";
import Alert from "./Alert";
import SuccessIcon from '@material-ui/icons/CheckCircle';
import useTheme from "@material-ui/core/styles/useTheme";


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
