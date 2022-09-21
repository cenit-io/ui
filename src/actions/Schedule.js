import React, { useEffect } from 'react';
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { FormRootValue } from "../services/FormValue";
import ScheduleIcon from "@material-ui/icons/Schedule";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { TasksHierarchy } from "../config/dataTypes/Setup/Task";
import { useSpreadState } from "../common/hooks";
import Loading from "../components/Loading";
import { useContainerContext } from './ContainerContext';

function SuccessSchedule() {
  return (
    <SuccessAlert mainIcon={ScheduleIcon} />
  );
}

const Schedule = ({ dataType, docked, record, onSubjectPicked, height }) => {
  const [state, setState] = useSpreadState();
  const containerContext = useContainerContext();
  const [, setContainerState] = containerContext;

  const { value, formDataType } = state;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Schedule" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    const subscription = dataType.get(record.id, {
      viewport: '{scheduler {namespace name}}',
      include_id: true
    }).subscribe(({ scheduler }) => {
        setState({
          value: new FormRootValue({
            scheduler
          }),
          formDataType: DataType.from({
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
          })
        })
      }
    );

    return () => subscription.unsubscribe();
  }, [record.id, dataType]);

  const handleFormSubmit = (_, value) => {
    const { scheduler } = value.get();
    return API.post(
      'setup', 'task', record.id, 'digest', 'schedule', scheduler || {}
    );
  };

  if (formDataType) {
    return (
      <div className="relative">
        <FormEditor docked={docked}
                    dataType={formDataType}
                    height={height}
                    submitIcon={<ScheduleIcon component="svg" />}
                    onFormSubmit={handleFormSubmit}
                    onSubjectPicked={onSubjectPicked}
                    successControl={SuccessSchedule}
                    value={value} />
      </div>
    );
  }

  return <Loading />;
};

export default ActionRegistry.register(Schedule, {
  kind: ActionKind.member,
  icon: ScheduleIcon,
  title: 'Schedule',
  arity: 1,
  onlyFor: TasksHierarchy
});
