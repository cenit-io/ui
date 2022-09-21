import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

export default function FilterIcon(props) {
  return (
    <SvgIcon {...props}>
      <path
        d="M10.47,24a1.14,1.14,0,0,1-.54-.14,1.12,1.12,0,0,1-.57-1V16.13a3,3,0,0,0-.61-1.8L2.62,6.51A2.41,2.41,0,0,1,2.11,5V2a2,2,0,0,1,2-2H19.92a2,2,0,0,1,2,2V5a2.41,2.41,0,0,1-.51,1.48l-6.13,7.82a3,3,0,0,0-.61,1.8V21a1.13,1.13,0,0,1-.53.94l-3.06,1.89A1.21,1.21,0,0,1,10.47,24ZM4.08,1.51A.47.47,0,0,0,3.61,2V5a.89.89,0,0,0,.19.55l6.13,7.83a4.45,4.45,0,0,1,.93,2.72v6.05l2.28-1.4V16.13a4.45,4.45,0,0,1,.93-2.72L20.2,5.58A.89.89,0,0,0,20.39,5V2a.47.47,0,0,0-.47-.47Zm9.24,19.15Z" />
      <path d="M16.22,6.35H7.78a.75.75,0,1,1,0-1.5h8.44a.75.75,0,0,1,0,1.5Z" />
    </SvgIcon>
  );
}
