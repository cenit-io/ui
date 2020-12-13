import React from 'react';
import HomeIcon from '@material-ui/icons/Home';

export default {
    title: 'Tenant',
    icon: <HomeIcon/>,
    actions: {
        index: {
            fields: ['name', 'notification_level', 'time_zone', 'updated_at']
        },
        new: {
            fields: ['name', 'notification_level', 'time_zone']
        }
    }
};
