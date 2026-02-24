import React from 'react';
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";
import AttachmentViewer from "../../../viewers/AttachmentViewer";

const ApiSpecImport = commonTaskConfig('Algorithm Execution', {
  base_url: {},
  data: {
    viewer: AttachmentViewer,
    control: ViewerControl
  }
});

export default ApiSpecImport;
