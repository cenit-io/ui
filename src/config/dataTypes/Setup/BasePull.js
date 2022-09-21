import commonTaskConfig from "./commonTaskConfig";
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import ViewerControl from "../../../components/ViewerControl";

const BasePull = commonTaskConfig('Pull', {
  _type: {},
  pull_request: {
    viewer: AttachmentViewer,
    control: ViewerControl
  },
  pulled_request: {
    viewer: AttachmentViewer,
    control: ViewerControl
  }
});

export default BasePull;
