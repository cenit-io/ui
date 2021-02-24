import React from 'react';
import NamespaceIcon from "@material-ui/icons/Dns";

export default {
    title: 'Namespace',
    icon: <NamespaceIcon/>,
    actions: {
        index: {
            fields: ['name', 'slug', 'updated_at']
        },
        new: {
            fields: ['name', 'slug']
        }
    }
};
