import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import { CRUD } from "../../../actions/ActionRegistry";
import ViewerControl from "../../../components/ViewerControl";

const LevelProjection = n => n?.type;

export default {
  title: 'System Notification',
  icon: <NotificationFilledIcon />,
  actions: {
    index: {
      fields: ['created_at', 'type', 'message', 'attachment', 'task']
    }
  },
  fields: {
    type: {
      control: ViewerControl,
      viewer: ErrorLevelViewer(LevelProjection, 'background')
    },
    attachment: {
      control: ViewerControl,
      viewer: AttachmentViewer
    },
    message: {
      control: ViewerControl,
      viewer: ErrorLevelViewer(LevelProjection)
    },
    task: {
      control: ViewerControl
    }
  },
  crud: [CRUD.read, CRUD.delete]
};
