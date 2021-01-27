import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";

const fields = ['name', 'type', 'many', 'group', 'description'];

export default {
    title: 'Action',
    icon: <ApplicationFilledIcon/>,
    actions: {
        new: { fields },
        edit: { fields }
    }
};
