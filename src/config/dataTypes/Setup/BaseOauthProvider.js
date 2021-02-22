import React from 'react';
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import ProviderFilledIcon from "../../../icons/ProviderFilledIcon";

const title = 'OAuth Provider';

const fields = [
    'namespace', 'name', 'response_type', 'authorization_endpoint',
    'token_endpoint', 'token_method'
];

export default {
    title,
    icon: <ProviderFilledIcon/>,
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
