import React from 'react';
import ResourceIcon from "@material-ui/icons/Work";

export default {
    title: 'Resource Path',
    icon: <ResourceIcon/>,
    titleViewport: '{namespace name}',
    itemLabel: ({ namespace, name, id }) => {
        if (namespace || name) {
            return `${namespace || 'default'} | ${name || '?'}`;
        }

        if (id) {
            return `Plain Webhook #${id}`;
        }

        return 'Plain Webhook (blank)';
    },
    actions: {
        index: {
            fields: ['namespace', 'name', 'path', 'method', 'description', 'authorization', 'updated_at']
        },
        new: {
            fields: [
                'namespace', 'name', 'path', 'method', 'description', 'metadata',
                'authorization', 'authorization_handler',
                'parameters', 'headers', 'template_parameters'
            ]
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
    }
};
