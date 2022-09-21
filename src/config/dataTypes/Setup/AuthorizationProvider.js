import React from 'react';
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";
import AuthorizationClientsFilledIcon from "../../../icons/AuthorizationClientsFilledIcon";

export default {
  title: 'Authorization Provider',
  icon: <ProviderFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', '_type', 'authorization_endpoint', 'updated_at']
    }
  }
};
