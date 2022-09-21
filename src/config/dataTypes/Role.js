import React from 'react';
import RoleIcon from '@material-ui/icons/AccountBox';
import MenuIcon from '@material-ui/icons/AccountBoxOutlined';
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
