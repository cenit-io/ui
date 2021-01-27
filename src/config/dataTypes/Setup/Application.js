import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";

export default {
    title: 'Application',
    icon: <ApplicationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'slug', 'registered', 'actions', 'application_parameters', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'slug',  'actions', 'application_parameters']
        }
    }
};
