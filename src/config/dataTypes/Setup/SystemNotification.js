import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import { CRUD } from "../../../actions/ActionRegistry";

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
    },
    crud: [CRUD.read, CRUD.delete]
};
