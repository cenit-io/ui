import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

export default function GatewayIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M21.07,11.25H2.93A2.89,2.89,0,0,1,0,8.36V2.93A2.89,2.89,0,0,1,2.93,0H21.07A2.89,2.89,0,0,1,24,2.93V8.36A2.89,2.89,0,0,1,21.07,11.25ZM2.93,1.54A1.39,1.39,0,0,0,1.54,2.93V8.36A1.39,1.39,0,0,0,2.93,9.75H21.07a1.39,1.39,0,0,0,1.39-1.39V2.93a1.39,1.39,0,0,0-1.39-1.39Z"/>
      <circle cx="6.06" cy="5.65" r="1.5"/>
      <path d="M12,18a.76.76,0,0,1-.75-.75V11.15a.75.75,0,1,1,1.5,0v6.06A.76.76,0,0,1,12,18Z"/>
      <path d="M12,24a3.51,3.51,0,1,1,3.5-3.51A3.51,3.51,0,0,1,12,24Zm0-5.51a2,2,0,1,0,2,2A2,2,0,0,0,12,18.46Z"/>
      <path d="M23.21,21.21H15a.75.75,0,0,1,0-1.5h8.17a.75.75,0,0,1,0,1.5Z"/>
      <path d="M8.88,21.21H.79a.75.75,0,1,1,0-1.5H8.88a.75.75,0,1,1,0,1.5Z"/>
    </SvgIcon>
  );
}
