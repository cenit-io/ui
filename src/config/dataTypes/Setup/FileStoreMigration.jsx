import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

// TODO Not yet supported in API v3
const FileStoreMigration = commonTaskConfig('File Store Migration', {
  data_type: {
    control: ViewerControl
  }
});

export default FileStoreMigration;
