import React from 'react';
import FileTypesFilledIcon from "../../../icons/FileTypesFilledIcon";
import DocumentTypesFilledIcon from "../../../icons/DocumentTypesFilledIcon";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const contentFields = [
    'validators',
    'schema_data_type'
];

const behaviorFields = [
    'before_save_callbacks',
    'after_save_callbacks',
    'records_methods',
    'data_type_methods'
];

const fields = [
    'namespace',
    'name',
    'id_type',
    'title',
    'slug',
    ...contentFields,
    ...behaviorFields
];

const viewport = `{id ${fields.join(' ')} _type origin}`;

export default {
    title: 'File Type',
    groups: {
        content: {
            fields: contentFields
        },
        behavior: {
            fields: behaviorFields
        }
    },
    actions: {
        new: {
            fields,
            viewport,
            seed: {
                id_type: 'default'
            }
        },
        edit: {
            fields: ['id', ...fields],
            viewport
        },
        index: {
            fields: ['namespace', 'name', 'slug', 'id_type', 'updated_at']
        },
        delete: {
            confirmation: true
        }
    },
    icon: <FileTypesFilledIcon/>,
    orchestrator: sharedOriginFields(...arrayDiff(fields,  'slug'))
};
