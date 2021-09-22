import React, { useRef } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import UpdateIcon from "@material-ui/icons/SystemUpdateAlt";
import { useContainerContext } from "./ContainerContext";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { ExecutionMonitor } from "./ExecutionMonitor";

function updateDataTypeFormFor(sourceDataType) {
    const dt = DataType.from({
        name: 'Update',
        schema: {
            type: 'object',
            properties: {
                updater: {
                    referenced: true,
                    $ref: {
                        namespace: 'Setup',
                        name: 'UpdaterTransformation'
                    }
                }
            }
        }
    });

    dt[Config] = {
        fields: {
            updater: {
                selector: {
                    $or: [
                        { target_data_type_id: { $exists: false } },
                        { target_data_type_id: sourceDataType.id }
                    ]
                }
            }
        }
    };

    return dt;
}

const Update = ({ docked, dataType, onSubjectPicked, height }) => {

    const [containerState,setContainerState] = useContainerContext();

    const { selectedItems, selector } = containerState;

    const handleCancel = () => {
        setContainerState({ actionKey: 'index' });
    }

    const value = useRef(new FormRootValue({
        data_type: {
            id: dataType.id,
            _reference: true
        },
        selector: selectedItems.length
            ? { _id: { $in: selectedItems.map(({ id }) => id) } }
            : selector || {}
    }));

    const formDataType = useRef(updateDataTypeFormFor(dataType));

    const handleFormSubmit = (_, value) => {
        const { data_type, selector, updater } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!updater?.id) {
                    error = { updater: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return API.post('setup', 'updater_transformation', updater.id, 'digest', {
                    target_data_type_id: data_type.id,
                    selector
                });
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<UpdateIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={ExecutionMonitor}
                        cancelEditor={handleCancel}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Update, {
    kind: ActionKind.collection,
    bulkable: true,
    icon: UpdateIcon,
    title: 'Update',
    crud: [CRUD.update]
});
