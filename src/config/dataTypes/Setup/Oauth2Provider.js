import React from 'react';
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";
import mergeOrchestrators from "../../orchestrators/mergeOrchestrators";

const title = 'OAuth 2.0 Provider';

const fields = [
  'namespace', 'name', 'response_type', 'authorization_endpoint', 'token_endpoint',
  'token_method', 'scope_separator', 'refresh_token_strategy', 'refresh_token_algorithm'
];

export default {
  title,
  icon: <ProviderFilledIcon />,
  actions: {
    index: {
      fields: [
        'namespace', 'name', 'response_type',
        'authorization_endpoint', 'token_endpoint',
        'refresh_token_strategy', 'updated_at'
      ]
    },
    new: { fields },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  dynamicConfig: ({ refresh_token_strategy, refresh_token_algorithm }, state, value) => {
    const refreshTokenAlgorithmHidden = refresh_token_strategy !== 'custom';
    if (refreshTokenAlgorithmHidden && refresh_token_algorithm) {
      value.propertyValue('refresh_token_algorithm').set(null, true);
    }
    if (state.refresh_token_algorithm?.hidden !== refreshTokenAlgorithmHidden) {
      return {
        refresh_token_algorithm: {
          hidden: refreshTokenAlgorithmHidden
        }
      };
    }
  },
  orchestrator: sharedOriginFields(...fields)
};
