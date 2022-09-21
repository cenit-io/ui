import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

export default function CheckIcon(props) {
  return (
    <SvgIcon {...props}>
      <path
        d="M22.4,0H1.6A1.6,1.6,0,0,0,0,1.6V22.4A1.6,1.6,0,0,0,1.6,24H22.4A1.6,1.6,0,0,0,24,22.4V1.6A1.6,1.6,0,0,0,22.4,0ZM17.78,10,10,17.78a.74.74,0,0,1-.53.22.71.71,0,0,1-.53-.22L6.22,15.1a.77.77,0,0,1,0-1.07.75.75,0,0,1,1.06,0l2.16,2.16,7.28-7.28a.74.74,0,0,1,1.06,0A.75.75,0,0,1,17.78,10Z" />
    </SvgIcon>
  );
}
