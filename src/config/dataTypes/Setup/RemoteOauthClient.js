import React from 'react';
import AuthorizationClientsFilledIcon from "../../../icons/AuthorizationClientsFilledIcon";
import lazy from "../../../components/lazy";
import StringControl from "../../../components/StringControl";
import { arrayDiff } from "../../../common/arrays";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";

const title = 'Remote OAuth Client';

const LazyControl = lazy(StringControl);

const fields = [
  'provider', 'name', 'identifier', 'secret',
  'request_token_parameters', 'request_token_headers', 'template_parameters'
];

export default {
  title,
  icon: <AuthorizationClientsFilledIcon />,
  titleViewport: '{provider {namespace name} name',
  actions: {
    index: {
      fields: ['provider', 'name', 'updated_at'],
      viewport: '{id provider {namespace name} name updated_at origin}'
    },
    new: { fields },
    edit: {
      viewportFields: [...arrayDiff(fields, 'identifier', 'secret'), 'origin']
    }
  },
  fields: {
    identifier: {
      control: LazyControl
    },
    secret: {
      control: LazyControl
    }
  },
  orchestrator: sharedOriginFields(...fields)
};
