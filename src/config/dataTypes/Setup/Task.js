import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";

const fields = [
    '_type', 'description', 'scheduler', 'attempts', 'succeded', 'retries',
    'progress', 'status', 'updated_at'
];

export default {
    title: 'Task',
    actions: {
        index: { fields },
        new: { fields }
    },
    crud: [CRUD.read, CRUD.delete]
};
