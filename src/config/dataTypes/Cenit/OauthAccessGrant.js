import React from 'react';
import AccessGrantFilledIcon from "../../../icons/AccessGrantFilledIcon";
import { CRUD } from "../../../actions/ActionRegistry";

export default {
    title: 'Access Grant',
    icon: <AccessGrantFilledIcon/>,
    actions: {
        index: {
            fields: ['app_name', 'scope', 'created_at']
        },
        edit: {
            fields: ['id', 'scope']
        }
    },
    crud: [CRUD.read, CRUD.update, CRUD.delete]
};
