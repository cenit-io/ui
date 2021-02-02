import React from 'react';
import UserIcon from '@material-ui/icons/SupervisedUserCircle';

export default {
    title: 'User',
    icon: <UserIcon/>,
    actions: {
        index: {
            fields: ['name', 'email', 'roles', 'account', 'created_at', 'updated_at']
        },
        new: {
            fields: ['name', 'email', 'roles', 'password', 'account']
        }
    }
};
