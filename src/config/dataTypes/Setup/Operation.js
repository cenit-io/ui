import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import WebhookFilledIcon from "../../../icons/WebhookFilledIcon";

export default {
    title: 'Operation',
    icon: <WebhookFilledIcon/>,
    itemLabel: ({ resource, method }) => {
        if (resource) {
            const { namespace, name } = resource;
            if (name) {
                method = `${name} | ${method}`;
            }
            method = `${namespace || 'default'} | ${method}`;
        }
        return method || '?';
    },
    actions: {
        index: {
            fields: ['resource', 'method', 'description', 'parameters', 'updated_at']
        },
        new: {
            fields: ['method', 'description', 'parameters']
        },
        edit: {
            fields: ['method', 'description', 'parameters'],
            viewport: '{resource {id namespace name} method description parameters}',
            embeddedViewport: '{method description parameters}'
        }
    },
    crud: [CRUD.read]
};
