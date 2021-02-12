import React, { useRef } from 'react';
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { FormRootValue } from "../services/FormValue";
import ScheduleIcon from "@material-ui/icons/Schedule";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { TasksHierarchy } from "../config/dataTypes/Setup/Task";

function SuccessSchedule() {
    return (
        <SuccessAlert mainIcon={ScheduleIcon}/>
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
                        successControl={SuccessSchedule}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(Schedule, {
    kind: ActionKind.member,
    icon: ScheduleIcon,
    title: 'Schedule',
    arity: 1,
    onlyFor: TasksHierarchy
});
