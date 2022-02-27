import React from 'react';
import UserIcon from '@material-ui/icons/SupervisedUserCircle';
import MenuIcon from '@material-ui/icons/SupervisedUserCircleOutlined';

export const UserMenuIcon = MenuIcon;

export default {
    title: 'User',
    icon: <UserIcon component="svg"/>,
    actions: {
        index: {
            fields: ['name', 'email', 'roles', 'account', 'created_at', 'updated_at']
        },
        new: {
            fields: ['name', 'email', 'roles', 'password', 'account']
        },
        delete: {
            confirmation: true
        }
    }
};
