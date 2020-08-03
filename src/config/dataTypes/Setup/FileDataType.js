import React from 'react';
import SvgIcon from "@material-ui/core/SvgIcon";

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

const viewport = `{id ${fields.join(' ')}}`;

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
            viewport
        },
        edit: {
            fields: ['id', ...fields],
            viewport
        }
    },
    icon: (
        <SvgIcon>
            <path
                d="M20,6h-8l-2-2H4C2.9,4,2.01,4.9,2.01,6L2,18c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M14,16H6v-2h8V16z M18,12H6v-2h12V12z"/>
        </SvgIcon>
    )
};
