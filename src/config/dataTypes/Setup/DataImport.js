import commonTaskConfig from "./commonTaskConfig";
import AttachmentViewer from "../../../viewers/AttachmentViewer";
import ViewerControl from "../../../components/ViewerControl";

const DataImport = commonTaskConfig('Data Import', {
    translator: {
        control: ViewerControl
    },
    data: {
        viewer: AttachmentViewer,
        control: ViewerControl
    }
});

export default DataImport;
