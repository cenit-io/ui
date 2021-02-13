import React from 'react';
import EmbedsManyControl from "../../../components/EmbedsManyControl";
import ResourceIcon from "@material-ui/icons/Work";

export default {
    title: 'Resource',
    icon: <ResourceIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'path', 'description', 'operations', 'updated_at'],
            viewport: '{namespace name path description operations {id method} updated_at}'
        },
        new: {
            fields: ['namespace', 'name', 'path', 'description', 'operations', 'parameters', 'headers', 'template_parameters']
        },
        edit: {
            viewport: '{namespace name path description operations {id method} parameters headers template_parameters}'
        }
    },
    groups: {
        parameters_and_headers: {
            title: 'Parameters & Headers',
            fields: ['parameters', 'headers', 'template_parameters']
        }
    },
    fields: {
        operations: {
            control: EmbedsManyControl
        }
    }
};
