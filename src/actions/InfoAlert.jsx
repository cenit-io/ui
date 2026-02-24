import React from "react";
import TypedAlert from "./TypedAlert";


export default function InfoAlert(
  {
    title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background
  }
) {
  return (
    <TypedAlert tone="info"
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
