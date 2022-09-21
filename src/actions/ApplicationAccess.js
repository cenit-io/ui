import ActionRegistry, { ActionKind } from "./ActionRegistry";
import AccessIcon from '@material-ui/icons/VpnKey';
import { RecordSubject, TabsSubject } from "../services/subjects";
import API from "../services/ApiService";
import { switchMap, map } from "rxjs/operators";
import { DataType } from "../services/DataTypeService";
import { of } from "rxjs";

function openAccess(access) {
  return DataType.find({
    namespace: 'Cenit',
    name: 'OauthAccessGrant'
  }).pipe(
    map(accessDataType => {
        TabsSubject.next({
          key: RecordSubject.for(accessDataType.id, access.id).key
        });
        return of(true);
      }
    )
  );
}

function ApplicationAccess({ record, containerContext }) {
  return API.get('setup', 'application', record.id, 'digest', 'access').pipe(
    switchMap(access => {
      if (access) {
        return openAccess(access)
      }

      return containerContext.confirm({
        title: 'Access grant confirmation',
        message: 'This application does not have access. Grant it?',
      }).pipe(
        switchMap(ok => {
          if (ok) {
            return API.post('setup', 'application', record.id, 'digest', 'access', {
              scope: 'read'
            }).pipe(
              switchMap(access => openAccess(access)) // TODO Handle grant access error
            );
          }
          return of(false);
        })
      );
    })
  )
}

export default ActionRegistry.register(ApplicationAccess, {
  kind: ActionKind.member,
  icon: AccessIcon,
  title: 'Access',
  arity: 1,
  onlyFor: [{ namespace: 'Setup', name: 'Application' }],
  executable: true
});
