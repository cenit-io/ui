import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";

export default {
    title: 'Application',
    icon: <ApplicationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'updated_at']
        }
    }
};
