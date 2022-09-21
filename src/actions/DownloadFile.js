import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { tap } from "rxjs/operators";
import DownloadIcon from "@material-ui/icons/CloudDownload";
import { saveAs } from 'file-saver';
import API from "../services/ApiService";
import { FILE_TYPE } from "../services/DataTypeService";

function DownloadFile({ dataType, record }) {

  return API.get('setup', 'data_type', dataType.id, 'digest', 'download', {
    headers: {
      'X-Query-Selector': JSON.stringify({ id: record.id })
    },
    responseType: 'blob'
  }).pipe(
    tap(data => data && saveAs(data, record.filename))
  );
}

export default ActionRegistry.register(DownloadFile, {
  kind: ActionKind.member,
  icon: DownloadIcon,
  title: 'Download',
  executable: true,
  arity: 1,
  onlyFor: [{ _type: FILE_TYPE }]
});
