import ActionRegistry, { ActionKind } from "./ActionRegistry";
import RetryIcon from '@material-ui/icons/Replay';
import { TasksHierarchy } from "../config/dataTypes/Setup/Task";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

function RetryTask({ dataType, record, containerContext }) {
  return dataType.titleFor(record).pipe(
    switchMap(title => containerContext.confirm({
      title: 'Retry Confirmation',
      message: `Task ${title} will be retried`
    })),
    switchMap(ok => {
      if (ok) {
        return API.get('setup', 'task', record.id, 'digest', 'retry');
      }
      return of(false);
    })
  );
}

export default ActionRegistry.register(RetryTask, {
  kind: ActionKind.member,
  icon: RetryIcon,
  title: 'Retry',
  arity: 1,
  onlyFor: TasksHierarchy,
  executable: true
});
