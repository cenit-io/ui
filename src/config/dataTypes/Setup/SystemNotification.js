import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import { CRUD } from "../../../actions/ActionRegistry";
import ViewerControl from "../../../components/ViewerControl";

const LevelProjection = n => n?.type;

export default {
    title: 'System Notification',
    icon: <NotificationFilledIcon/>,
    actions: {
        index: {
            fields: ['created_at', 'type', 'message', 'attachment', 'task']
        }
    },
    fields: {
        type: {
            control: ViewerControl
        },
        attachment: {
            control: ViewerControl
        },
        message: {
            control: ViewerControl
        },
        task: {
            control: ViewerControl
        }
    },
    viewers: {
        type: ErrorLevelViewer(LevelProjection, 'background'),
        message: ErrorLevelViewer(LevelProjection),
        attachment: AttachmentViewer
    },
    crud: [CRUD.read, CRUD.delete]
};
