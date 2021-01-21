import React from 'react';
import AttachmentViewer from "../../../viewers/AttachmentViewer";

export default {
    title: 'Execution',
    actions: {
        index: {
            fields: ['created_at', 'started_at', 'time_span', 'status', 'attachment', 'task']
        }
    },
    viewers: {
        attachment: AttachmentViewer
    }
};
