const fields = [
    'namespace',
    'name',
    'schema',
    'discard_additional_properties',
    'title',
    'slug',
    'before_save_callbacks',
    'after_save_callbacks',
    'records_methods',
    'data_type_methods'
];

const viewport = `{${fields.join(' ')}}`;

export default {
    title: 'JSON Data Type',
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
            fields,
            viewport
        }
    }
};
