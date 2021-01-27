import React, { useRef } from 'react';
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { FormRootValue } from "../services/FormValue";
import ScheduleIcon from "@material-ui/icons/Schedule";
import ActionRegistry, { ActionKind } from "./ActionRegistry";

function SuccessUpdate() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

const Schedule = ({ docked, record, onSubjectPicked, height }) => {

    const value = useRef(new FormRootValue({
        scheduler: record.scheduler
    }));

    const formDataType = useRef(DataType.from({
        name: 'Schedule',
        schema: {
            type: 'object',
            properties: {
                scheduler: {
                    referenced: true,
                    $ref: {
                        namespace: 'Setup',
                        name: 'Scheduler'
                    }
                }
            }
        }
    }));

    const handleFormSubmit = (_, value) => {
        const { scheduler } = value.get();
        return API.post(
            'setup', 'task', record.id, 'digest', 'schedule', scheduler || {}
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<ScheduleIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessUpdate}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Schedule, {
    kind: ActionKind.member,
    icon: ScheduleIcon,
    title: 'Schedule',
    arity: 1,
    onlyFor: [
        {
            "namespace": "Setup",
            "name": "Task"
        },
        {
            "namespace": "Setup",
            "name": "AsynchronousPersistence"
        },
        {
            "namespace": "Setup",
            "name": "BasePull"
        },
        {
            "namespace": "Setup",
            "name": "PullImport"
        },
        {
            "namespace": "Setup",
            "name": "SharedCollectionPull"
        },
        {
            "namespace": "Setup",
            "name": "ApiPull"
        },
        {
            "namespace": "",
            "name": "ScriptExecution"
        },
        {
            "namespace": "Setup",
            "name": "AlgorithmExecution"
        },
        {
            "namespace": "Setup",
            "name": "ApiSpecImport"
        },
        {
            "namespace": "Setup",
            "name": "CollectionSharing"
        },
        {
            "namespace": "Setup",
            "name": "Crossing"
        },
        {
            "namespace": "Setup",
            "name": "DataImport"
        },
        {
            "namespace": "Setup",
            "name": "DataTypeDigest"
        },
        {
            "namespace": "Setup",
            "name": "DataTypeExpansion"
        },
        {
            "namespace": "Setup",
            "name": "DataTypeGeneration"
        },
        {
            "namespace": "Setup",
            "name": "Deletion"
        },
        {
            "namespace": "Setup",
            "name": "FileStoreMigration"
        },
        {
            "namespace": "Setup",
            "name": "FlowExecution"
        },
        {
            "namespace": "Setup",
            "name": "NamespaceCollection"
        },
        {
            "namespace": "Setup",
            "name": "NotificationExecution"
        },
        {
            "namespace": "Setup",
            "name": "Push"
        },
        {
            "namespace": "Setup",
            "name": "SchemasImport"
        },
        {
            "namespace": "Setup",
            "name": "Submission"
        },
        {
            "namespace": "Setup",
            "name": "Translation"
        }
    ]
});
