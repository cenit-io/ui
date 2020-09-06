import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import FlowFilledIcon from "../../../icons/FlowFilledIcon";

export default {
    title: 'Notification',
    icon: <NotificationFilledIcon/>,
    actions: {
        index: {
            fields: ['created_at', 'type', 'message', 'task']
        }
    }
};
