import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

export default function IntegrationFilledIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M13.75,7H7v6.74A3.24,3.24,0,0,0,10.25,17H17V10.25A3.24,3.24,0,0,0,13.75,7Z"/>
      <path d="M5.39,13.76V7H3.24A3.24,3.24,0,0,0,0,10.25V20.76A3.24,3.24,0,0,0,3.24,24H13.75A3.24,3.24,0,0,0,17,20.76V18.6H10.24A4.85,4.85,0,0,1,5.39,13.76Z"/>
      <path d="M20.76,0H10.25A3.24,3.24,0,0,0,7,3.24V5.39h6.75a4.85,4.85,0,0,1,4.85,4.84V17h2.15A3.24,3.24,0,0,0,24,13.75V3.24A3.24,3.24,0,0,0,20.76,0Z"/>
    </SvgIcon>
  );
}
