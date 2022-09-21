import React from 'react';
import OauthScopesFilledIcon from "../../../icons/OauthScopesFilledIcon";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";

const fields = ['provider', 'name', 'description'];

export default {
  title: 'OAuth 2.0 Scope',
  icon: <OauthScopesFilledIcon />,
  actions: {
    index: {
      fields: [...fields, 'updated_at']
    },
    new: {
      fields: ['provider', 'name', 'description']
    },
    edit: {
      viewport: '{provider {namespace name} name description origin}'
    }
  },
  orchestrator: sharedOriginFields(...fields)
};
