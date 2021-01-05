import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import AttachmentViewer from "../../../viewers/AttachmentViewer";

const LevelProjection = ({ type }) => type;

export default {
    title: 'System Notification',
    icon: <NotificationFilledIcon/>,
    actions: {
        index: {
            fields: ['created_at', 'type', 'message', 'attachment', 'task']
        }
    },
    viewers: {
        type: ErrorLevelViewer(LevelProjection, 'background'),
        message: ErrorLevelViewer(LevelProjection),
        attachment: AttachmentViewer
    }
};
