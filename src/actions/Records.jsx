import ActionRegistry, { ActionKind } from "./ActionRegistry";
import ListIcon from '@mui/icons-material/List';
import { DataTypeSubject, RecordSubject, TabsSubject } from "../services/subject";

function Records({ dataType, record }) {
  TabsSubject.next({
    key: DataTypeSubject.for(record.id).key
  });
}

export default ActionRegistry.register(Records, {
  kind: ActionKind.member,
  icon: ListIcon,
  title: 'Records',
  arity: 1,
  onlyFor: [
    { namespace: 'Setup', name: 'JsonDataType' },
    { namespace: 'Setup', name: 'FileDataType' },
    { namespace: 'Setup', name: 'CenitDataType' }
  ],
  executable: true
});
