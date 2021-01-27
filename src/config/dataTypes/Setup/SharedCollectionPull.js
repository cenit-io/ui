import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import AttachmentViewer from "../../../viewers/AttachmentViewer";

const fields = [
    'shared_collection', 'pull_request', 'pulled_request', 'description', 'scheduler',
    'attempts', 'succeded', 'retries', 'progress', 'status', 'updated_at'
];

export default {
    title: 'Shared Collection Pull',
    actions: {
        index: { fields },
        new: { fields }
    },
    viewers: {
        data: AttachmentViewer,
        pull_request: AttachmentViewer,
        pulled_request: AttachmentViewer
    },
    crud: [CRUD.read, CRUD.delete]
};
