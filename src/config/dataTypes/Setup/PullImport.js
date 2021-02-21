import React from 'react';
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const PullImport = commonTaskConfig('Pull Import', {
    data: {
        viewer: AttachmentViewer,
        control: ViewerControl
    },
    pull_request: {
        viewer: AttachmentViewer,
        control: ViewerControl
    },
    pulled_request: {
        viewer: AttachmentViewer,
        control: ViewerControl
    }
});

export default PullImport;
