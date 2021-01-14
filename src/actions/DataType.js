import ActionRegistry, { ActionKind } from "./ActionRegistry";
import DataTypeIcon from '@material-ui/icons/Block';
import { DataTypeSubject, RecordSubject, TabsSubject } from "../services/subjects";
import { CENIT_TYPE, FILE_TYPE, JSON_TYPE } from "../services/DataTypeService";
import { DataType as DataTypeService } from '../services/DataTypeService';
import CenitTypesIcon from "../icons/CenitTypesIcon";
import { tap } from "rxjs/operators";

function DataType({ dataType }) {
    let dataTypeCrit;
    switch (dataType._type) {
        case FILE_TYPE: {
            dataTypeCrit = {
                namespace: 'Setup',
                name: 'FileDataType'
            }
        }
            break;
        case JSON_TYPE: {
            dataTypeCrit = {
                namespace: 'Setup',
                name: 'JsonDataType'
            }
        }
            break;

        case CENIT_TYPE: {
            dataTypeCrit = {
                namespace: 'Setup',
                name: 'CenitDataType'
            }
        }
            break;

        default: {
            dataTypeCrit = {
                namespace: 'Setup',
                name: 'DataType'
            }
        }
    }

    return DataTypeService.find(dataTypeCrit).pipe(
        tap(
            dt => {
                if (dt) {
                    TabsSubject.next(RecordSubject.for(dt.id, dataType.id).key);
                }
            }
        )
    );
}

export default ActionRegistry.register(DataType, {
    kind: ActionKind.collection,
    icon: CenitTypesIcon,
    title: 'Data Type',
    executable: true
});
