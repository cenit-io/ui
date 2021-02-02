import React from 'react';
import RoleIcon from '@material-ui/icons/AccountBox';
import { CRUD } from "../../actions/ActionRegistry";

export default {
    title: 'Role',
    icon: <RoleIcon/>,
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
