import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";
import { CRUD } from "../../../actions/ActionRegistry";

export default {
    title: 'Build-in App',
    icon: <ApplicationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'slug', 'updated_at']
        },
        edit: {
            fields: ['namespace', 'name', 'slug', 'identifier', 'secret', 'updated_at']
        }
    },
    crud: [CRUD.read]
};
