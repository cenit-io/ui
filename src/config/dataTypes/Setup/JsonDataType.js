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

const justOneParameterSelector = {
    parameters_size: 1
};

const atLeastOneParameterSelector = {
    parameters_size: {
        $gte: 1
    }
};

export default {
    title: 'JSON Data Type',
    groups: {
        behavior: {
            fields: behaviorFields
        }
    },
    fields: {
        before_save_callbacks: {
            selector: justOneParameterSelector
        },
        after_save_callbacks: {
            selector: justOneParameterSelector
        },
        records_methods: {
            selector: atLeastOneParameterSelector
        },
        data_type_methods: {
            selector: atLeastOneParameterSelector
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
