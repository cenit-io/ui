import React from 'react';
import ConnectorFilledIcon from "../../../icons/ConnectorFilledIcon";

export default {
    title: 'Connection',
    icon: <ConnectorFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'url', 'authorization', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'url', 'authorization', 'authorization_handler', 'parameters', 'headers', 'template_parameters']
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
