import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

export default function ConfigurationIcon(props) {
  return (
    <SvgIcon {...props}>
      <path
        d="M.77,4.58H14.05a2.52,2.52,0,0,0,4.82,0h4.36a.75.75,0,0,0,0-1.5H18.87a2.52,2.52,0,0,0-4.82,0H.77a.75.75,0,1,0,0,1.5Z" />
      <path
        d="M23.23,19.42H18.87a2.52,2.52,0,0,0-4.82,0H.77a.75.75,0,1,0,0,1.5H14.05a2.52,2.52,0,0,0,4.82,0h4.36a.75.75,0,1,0,0-1.5Z" />
      <path
        d="M23.23,11.25H9.41a2.52,2.52,0,0,0-4.82,0H.77a.75.75,0,1,0,0,1.5H4.59a2.52,2.52,0,0,0,4.82,0H23.23a.75.75,0,1,0,0-1.5Z" />
    </SvgIcon>
  );
}
