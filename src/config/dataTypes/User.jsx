import React from 'react';
import UserIcon from '@mui/icons-material/SupervisedUserCircle';
import MenuIcon from '@mui/icons-material/SupervisedUserCircleOutlined';

export const UserMenuIcon = MenuIcon;

export default {
  title: 'User',
  icon: <UserIcon component="svg" />,
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
