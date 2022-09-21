import React from 'react';
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import ViewerControl from "../../../components/ViewerControl";
import { arrayDiff } from "../../../common/arrays";
import { NEW } from "../../../common/Symbols";

const fields = ['id', 'namespace', 'name', 'authorized', 'client', 'scopes', 'parameters', 'template_parameters', 'metadata'];

export default {
  title: 'OAuth 2.0 Authorization',
  icon: <AuthorizationFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'authorized', 'client', 'scopes', 'updated_at'],
      viewport: '{id namespace name authorized client {id provider {namespace name} name} scopes updated_at}'
    },
    new: { fields: arrayDiff(fields, 'id', 'authorized') },
    edit: {
      fields,
      viewport: '{id namespace name authorized client {id provider {namespace name} name}' +
        'scopes parameters template_parameters metadata}'
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
    },
    scopes: {
      controlProps: {
        additionalViewportProps: ['provider']
      }
    }
  },
  dynamicConfig: ({ client }, state, value) => {
    const provider = client?.provider || {};
    if (provider.id !== state.provider_id) {
      if (state.provider_id) {
        value.propertyValue('scopes').set([], true);
      }
      const newState = { provider_id: provider.id || NEW };
      if (provider.id) {
        newState.scopes = {
          selector: {
            provider_id: provider.id
          }
        }
      } else {
        newState.scopes = {
          hidden: true
        }
      }
      return newState;
    }
  }
};
