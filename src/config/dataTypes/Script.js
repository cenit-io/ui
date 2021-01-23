import React from 'react';

import '../../actions/RunScript';

export default {
    title: 'Script',
    actions: {
        index: {
            fields: ['name', 'description', 'code', 'updated_at']
        },
        new: {
            fields: ['name', 'description', 'code']
        }
    }
};
