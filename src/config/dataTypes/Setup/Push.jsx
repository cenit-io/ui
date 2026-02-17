import React from 'react';
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const Push = commonTaskConfig('Push', {
  source_collection: {
    control: ViewerControl
  },
  shared_collection: {
    control: ViewerControl
  }
});

export default Push;
