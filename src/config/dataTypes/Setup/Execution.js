import React from 'react';
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import ViewerControl from "../../../components/ViewerControl";

export default {
  title: 'Execution',
  actions: {
    index: {
      fields: ['created_at', 'started_at', 'time_span', 'status', 'attachment', 'task']
    }
  },
  fields: {
    attachment: {
      viewer: AttachmentViewer,
      control: ViewerControl
    }
  }
};
