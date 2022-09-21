import React from 'react';
import EmailFlowIcon from "@material-ui/icons/Email";

export default {
  title: 'E-Mail Flow',
  icon: <EmailFlowIcon component="svg" />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'send_flow', 'updated_at']
    },
    new: {
      fields: ['namespace', 'name', 'send_flow']
    }
  }
};
