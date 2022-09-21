import React from 'react';
import WebhookIcon from "../../../icons/WebhookIcon";
import { LazyStringControl } from "../../../components/LazyStringControl";

const commonFields = ['namespace', 'name', 'channels'];

export default {
  title: 'Hook',
  icon: <WebhookIcon />,
  actions: {
    index: {
      fields: [...commonFields, 'created_at']
    },
    new: {
      fields: commonFields,
    },
    edit: {
      fields: [...commonFields, 'token'],
      viewportFields: commonFields
    },
  },
  groups: {
    credentials: {
      fields: ['token']
    }
  },
  fields: {
    token: {
      control: LazyStringControl,
      readOnly: true
    },
  }
};
