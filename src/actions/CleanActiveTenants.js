import ActionRegistry, { ActionKind } from "./ActionRegistry";
import CleanIcon from "@material-ui/icons/ClearAll";
import API from "../services/ApiService";
import { switchMap, map } from "rxjs/operators";
import { of } from "rxjs";

function CleanActiveTenants({ dataType, containerContext }) {

  return containerContext.confirm({
    title: 'Clean confirmation',
    message: 'All the active tenants will be reset',
  }).pipe(
    switchMap(ok => {
      if (ok) {
        return API.get('setup', 'data_type', dataType.id, 'digest', 'clean').pipe(
          map(() => true)
        );
      }
      return of(false);
    })
  );
}

export default ActionRegistry.register(CleanActiveTenants, {
  kind: ActionKind.collection,
  icon: CleanIcon,
  title: 'Clean',
  executable: true,
  onlyFor: [{ namespace: 'Cenit', name: 'ActiveTenant' }]
});
