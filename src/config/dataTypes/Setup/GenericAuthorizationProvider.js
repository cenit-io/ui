import React from 'react';
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";

const title = 'Generic Provider';

const fields = [
  'namespace', 'name', 'authorization_endpoint'
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
