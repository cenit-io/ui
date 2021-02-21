import React from 'react';
import EmbedsManyControl from "../../../components/EmbedsManyControl";
import ResourceIcon from "@material-ui/icons/Work";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = ['namespace', 'name', 'path', 'description', 'operations', 'parameters', 'headers', 'template_parameters'];

export default {
    title: 'Resource',
    icon: <ResourceIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'path', 'description', 'operations', 'updated_at'],
            viewport: '{id namespace name path description operations {id method} updated_at}'
        },
        new: { fields },
        edit: {
            viewport: '{namespace name path description operations {id method} parameters headers template_parameters origin}'
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
    },
    orchestrator: sharedOriginFields(
        ...arrayDiff(fields, 'authorization', 'parameters', 'headers', 'template_parameters')
    )
};
