import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const NotificationFlowExecution = commonTaskConfig('Notification FLow Execution', {
  notification: {
    control: ViewerControl
  },
});

export default NotificationFlowExecution;
