import React from 'react';
import RoleIcon from '@mui/icons-material/AccountBox';
import MenuIcon from '@mui/icons-material/AccountBoxOutlined';
import { CRUD } from "../../actions/ActionRegistry";

export const RoleMenuIcon = MenuIcon;

export default {
  title: 'Role',
  icon: <RoleIcon component="svg" />,
  actions: {
    index: {
      fields: ['name', 'metadata', 'updated_at']
    },
    new: {
      fields: ['name', 'metadata']
    }
  },
  crud: [CRUD.read, CRUD.update, CRUD.create]
};
