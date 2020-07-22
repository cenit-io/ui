import { preprocess } from "../../config";

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

const viewport = `{id ${fields.join(' ')}}`;

export default {
    title: 'JSON Data Type',
    groups: {
        behavior: {
            fields: behaviorFields
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
        }
    }
};
