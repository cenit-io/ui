import React from 'react';
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";

const title = 'OAuth 1.0 Provider';

const fields = [
  'namespace', 'name', 'response_type', 'authorization_endpoint',
  'token_endpoint', 'token_method', 'request_token_endpoint'
];

export default {
  title,
  icon: <ProviderFilledIcon />,
  actions: {
    index: {
      fields: [...fields, 'updated_at']
    },
    new: { fields },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  orchestrator: sharedOriginFields(...fields)
};
