import React from 'react';
import ConnectorFilledIcon from "../../../icons/ConnectorFilledIcon";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = [
  'namespace', 'name', 'url', 'authorization', 'authorization_handler',
  'parameters', 'headers', 'template_parameters'
];

export default {
  title: 'Connection',
  icon: <ConnectorFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'url', 'authorization', 'updated_at']
    },
    new: { fields },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  groups: {
    credentials: {
      fields: ['authorization', 'authorization_handler']
    },
    parameters_and_headers: {
      title: 'Parameters & Headers',
      fields: ['parameters', 'headers', 'template_parameters']
    }
  },
  orchestrator: sharedOriginFields(
    ...arrayDiff(fields, 'authorization', 'parameters', 'headers', 'template_parameters')
  )
};
