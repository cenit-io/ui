import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import { TaskIcon, TaskStatusViewer } from "./Task";
import ViewerControl from "../../../components/ViewerControl";

const CommonFields = [
    'description', 'status', 'progress',
    'scheduler', 'attempts', 'succeded',
    'retries', 'updated_at'
];

export default function (title, customFields) {
    customFields = customFields || {};
    const fields = [...Object.keys(customFields), ...CommonFields];

    return {
        title,
        icon: <TaskIcon/>,
        actions: {
            index: { fields },
            new: { fields }
        },
        fields: {
            status: {
                control: ViewerControl,
                viewer: TaskStatusViewer
            },
            ...customFields
        },
        crud: [CRUD.read, CRUD.delete]
    };
}
