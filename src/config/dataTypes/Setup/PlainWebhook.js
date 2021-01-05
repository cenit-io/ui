import React from 'react';
import WebhookFilledIcon from "../../../icons/WebhookFilledIcon";
import ParserFilledIcon from "../../../icons/ParserFilledIcon";

export default {
    title: 'Plain Webhook',
    icon: <WebhookFilledIcon/>,
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
