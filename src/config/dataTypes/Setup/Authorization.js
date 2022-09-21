import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";

export default {
  title: 'Authorization',
  icon: <AuthorizationFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', '_type', 'updated_at']
    }
  }
};
