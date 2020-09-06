import React from 'react';

export default {
    title: 'Task',
    actions: {
        index: {
            fields: ['_type', 'description', 'scheduler', 'attempts', 'succeded', 'retries', 'progress', 'status', 'updated_at']
        }
    }
};
