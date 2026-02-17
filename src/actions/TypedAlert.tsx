import React from "react";
import { useTheme } from "@mui/material/styles";
import InfoIcon from "@mui/icons-material/Info";
import SuccessIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Info";

import Alert from "./Alert";

type AlertTone = "info" | "success" | "warning";

type TypedAlertProps = {
  tone?: AlertTone;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  mainIcon?: React.ElementType;
  mainIconColor?: string;
  smallIcon?: React.ElementType;
  smallIconColor?: string;
  background?: string;
};

const toneIcon = {
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
};

export default function TypedAlert({
  tone = "info",
  title,
  message,
  children,
  mainIcon,
  mainIconColor,
  smallIcon,
  smallIconColor,
  background,
}: TypedAlertProps) {
  const theme = useTheme();
  const icon = smallIcon || toneIcon[tone];
  const defaultColor = theme.palette[tone].main;
  const defaultBg = theme.palette[tone].light;

  return (
    <Alert
      title={title}
      message={message}
      mainIconColor={mainIconColor}
      smallIcon={icon}
      smallIconColor={smallIconColor || defaultColor}
      background={background || defaultBg}
      mainIcon={mainIcon}
    >
      {children}
    </Alert>
  );
}
