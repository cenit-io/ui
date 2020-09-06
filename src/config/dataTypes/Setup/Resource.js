import React from 'react';
import ConnectorFilledIcon from "../../../icons/ConnectorFilledIcon";

export default {
    title: 'Resource',
    actions: {
        index: {
            fields: ['namespace', 'name', 'path', 'description', 'operations', 'updated_at']
        }
    }
};
