import React from 'react';
import DocumentTypesFilledIcon from "../../../icons/DocumentTypesFilledIcon";
import { AtLeastOneParameter, JustOneParameter } from "../../../common/selectors";

const behaviorFields = [
    'before_save_callbacks',
    'after_save_callbacks',
    'records_methods',
    'data_type_methods'
];

const fields = [
    'namespace',
    'name',
    'schema',
    'discard_additional_properties',
    'title',
    'slug',
    ...behaviorFields
];

const viewport = `{id ${fields.join(' ')} _type}`;

export default {
    title: 'Document Type',
    groups: {
        behavior: {
            fields: behaviorFields
        }
    },
    fields: {
        before_save_callbacks: {
            selector: JustOneParameter
        },
        after_save_callbacks: {
            selector: JustOneParameter
        },
        records_methods: {
            selector: AtLeastOneParameter
        },
        data_type_methods: {
            selector: AtLeastOneParameter
        }
    },
    actions: {
        new: {
            fields,
            viewport,
            seed: {
                schema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        edit: {
            fields: ['id', ...fields],
            viewport
        },
        index: {
            fields: ['namespace', 'name', 'slug', 'discard_additional_properties', 'updated_at']
        }
    },
    icon: <DocumentTypesFilledIcon/>
};
