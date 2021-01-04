import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";

const LevelProjection = ({ type }) => type;

export default {
    title: 'Notification',
    icon: <NotificationFilledIcon/>,
    actions: {
        index: {
            fields: ['created_at', 'type', 'message', 'task']
        }
    },
    viewers: {
        type: ErrorLevelViewer(LevelProjection, 'background'),
        message: ErrorLevelViewer(LevelProjection)
    }
};
