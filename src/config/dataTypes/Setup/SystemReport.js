import React from 'react';
import NotificationFilledIcon from "../../../icons/NotificationFilledIcon";
import MenuIcon from "../../../icons/NotificationsIcon";
import ErrorLevelViewer from "../../../viewers/ErrorLevelViewer";
import AttachmentViewer from "../../../viewers/AttachmentViewer";

const LevelProjection = ({ type }) => type;

export const SystemReportMenuIcon = MenuIcon;

export default {
  title: 'System Report',
  icon: <NotificationFilledIcon />,
  actions: {
    index: {
      fields: ['created_at', 'tenant', 'type', 'message', 'attachment']
    }
  },
  fields: {
    type: {
      viewer: ErrorLevelViewer(LevelProjection, 'background')
    },
    message: {
      viewer: ErrorLevelViewer(LevelProjection)
    },
    attachment: {
      viewer: AttachmentViewer
    }
  }
};
