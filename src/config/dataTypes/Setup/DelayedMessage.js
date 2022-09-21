import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import SvgIcon from "@material-ui/core/SvgIcon";

export const DelayedMessageIcon = props => (
  <SvgIcon {...props}>
    <path
      d="M16.5 12.5H15v4l3 2 .75-1.23-2.25-1.52V12.5zM16 9L2 3v7l9 2-9 2v7l7.27-3.11C10.09 20.83 12.79 23 16 23c3.86 0 7-3.14 7-7s-3.14-7-7-7zm0 12c-2.75 0-4.98-2.22-5-4.97v-.07c.02-2.74 2.25-4.97 5-4.97 2.76 0 5 2.24 5 5S18.76 21 16 21z" />
  </SvgIcon>
);

export const DelayedMessageMenuIcon = props => (
  <SvgIcon {...props}>
    <g>
      <path
        d="M17,12c-2.76,0-5,2.24-5,5s2.24,5,5,5c2.76,0,5-2.24,5-5S19.76,12,17,12z M18.65,19.35l-2.15-2.15V14h1v2.79l1.85,1.85 L18.65,19.35z" />
      <path
        d="M11,12l-6-1.5V7.01l8.87,3.74c0.94-0.47,2-0.75,3.13-0.75c0.1,0,0.19,0.01,0.28,0.01L3,4v16l7-2.95c0-0.02,0-0.03,0-0.05 c0-0.8,0.14-1.56,0.39-2.28L5,16.99V13.5L11,12z" />
    </g>
  </SvgIcon>
);

const fields = ['updated_at', 'message', 'publish_at', 'live_publish_at', 'unscheduled', 'tenant'];

export default {
  title: 'Delayed Message',
  icon: <DelayedMessageIcon />,
  actions: {
    index: { fields }
  },
  crud: [CRUD.read, CRUD.delete]
};
