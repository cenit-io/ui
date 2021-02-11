import React, { useRef } from 'react';
import RunIcon from '@material-ui/icons/PlayCircleFilled';
import RunActionIcon from '@material-ui/icons/PlayArrow';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import { ClickAndRun } from "./RunAlgorithm";
import { ExecutionMonitor } from "./ExecutionMonitor";


const RunScript = ({ docked, record, onSubjectPicked, height }) => {
    const formDataType = useRef(DataType.from({
        name: 'Script',
        schema: {},
        [Config]: {
            formViewComponent: ClickAndRun
        }
    }));

    const handleFormSubmit = (_, value) => API.post(
        'setup', 'script', record.id, 'digest', value.get()
    );

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<RunActionIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={ExecutionMonitor}
                        noSubmitButton={true}
                        noJSON={true}/>
        </div>
    );
};

export default ActionRegistry.register(RunScript, {
    kind: ActionKind.member,
    icon: RunIcon,
    title: 'Run',
    arity: 1,
    onlyFor: [{ namespace: '', name: 'Script' }]
});
