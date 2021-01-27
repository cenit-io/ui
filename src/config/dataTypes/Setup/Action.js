import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";

const fields = ['method', 'path', 'algorithm'];

export default {
    title: 'Action',
    icon: <ApplicationFilledIcon/>,
    actions: {
        new: { fields },
        edit: { fields }
    }
};
