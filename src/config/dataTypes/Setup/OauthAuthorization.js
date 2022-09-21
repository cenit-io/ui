import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import ViewerControl from "../../../components/ViewerControl";
import { arrayDiff } from "../../../common/arrays";

const fields = ['id', 'namespace', 'name', 'authorized', 'client', 'parameters', 'template_parameters', 'metadata'];

export default {
  title: 'OAuth 1.0 Authorization',
  icon: <AuthorizationFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'authorized', 'client', 'updated_at'],
      viewport: '{id namespace name authorized client {id provider {namespace name} name} updated_at}'
    },
    new: { fields: arrayDiff(fields, 'id', 'authorized') },
    edit: {
      fields,
      viewport: '{id namespace name authorized client {id provider {namespace name} name}' +
        'parameters template_parameters metadata}'
    }
  },
  fields: {
    authorized: {
      control: ViewerControl
    },
    client: {
      controlProps: {
        additionalViewportProps: ['namespace', 'provider']
      }
    }
  }
};
