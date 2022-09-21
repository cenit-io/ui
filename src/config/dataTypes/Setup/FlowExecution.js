import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const FlowExecution = commonTaskConfig('Flow Execution', {
  flow: {
    control: ViewerControl
  }
});

export default FlowExecution;
