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
    const customViewers = {};
    const fieldsConfig = {};
    Object.keys(customFields).forEach(field => {
        const fieldConfig = { ...customFields[field] };
        if (fieldConfig.viewer) {
            customViewers[field] = fieldConfig.viewer;
            delete fieldConfig.viewer;
        }
        if (Object.keys(fieldConfig).length) {
            fieldsConfig[field] = fieldConfig;
        }
    });

    return {
        title,
        icon: <TaskIcon/>,
        actions: {
            index: { fields },
            new: { fields }
        },
        viewers: {
            status: TaskStatusViewer,
            ...customViewers
        },
        fields: {
            status: {
                control: ViewerControl
            },
            ...fieldsConfig
        },
        crud: [CRUD.read, CRUD.delete]
    };
}
