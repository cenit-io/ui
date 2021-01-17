import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { switchMap, tap } from "rxjs/operators";
import DownloadIcon from "@material-ui/icons/CloudDownload";
import { saveAs } from 'file-saver';
import API from "../services/ApiService";
import { FILE_TYPE } from "../services/DataTypeService";

function DownloadFile({ dataType, record }) {

    return API.get('setup', 'data_type', dataType.id, {
        headers: {
            'X-Template-Options': JSON.stringify({ viewport: '{ns_slug slug}' })
        }
    }).pipe(
        switchMap(({ ns_slug, slug }) => API.get(ns_slug, slug, record.id, 'digest', {
            responseType: 'blob'
        })),
        tap(data => saveAs(data, record.filename))
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
