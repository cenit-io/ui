import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";

export default {
  title: 'Authorization',
  icon: <AuthorizationFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'authorized', '_type', 'updated_at']
    }
  }
};
