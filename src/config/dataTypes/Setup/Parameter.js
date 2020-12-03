import React from 'react';

const editFields = ['key', 'value', 'description', 'metadata'];

export default {
    title: 'Parameter',
    actions: {
        index: {
            fields: ['key', 'value', 'updated_at']
        },
        new: {
            fields: editFields,
            seed: {
                metadata: {}
            }
        },
        edit: {
            fields: editFields
        }
    }
};
