import React from "react";
import TypedAlert from "./TypedAlert";


export default function SuccessAlert(
  {
    title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background
  }
) {
  return (
    <TypedAlert tone="success"
                title={title}
                message={message}
                mainIconColor={mainIconColor}
                smallIcon={smallIcon}
                smallIconColor={smallIconColor}
                background={background}
                mainIcon={mainIcon}>
      {children}
    </TypedAlert>
  );
}

export const SuccessAlertWith = props => () => <SuccessAlert {...props} />;
