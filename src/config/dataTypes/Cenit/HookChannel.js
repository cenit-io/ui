import React from 'react';
import WebhookIcon from "../../../icons/WebhookIcon";

const fields = ['slug', 'data_type'];

export default {
  title: 'HookChannel',
  icon: <WebhookIcon />,
  actions: {
    new: { fields },
    edit: { fields }
  },
};
