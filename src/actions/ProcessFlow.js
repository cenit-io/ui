import React, { useRef } from 'react';
import ProcessIcon from '@material-ui/icons/PlayCircleFilledOutlined';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import { ClickAndRun } from "./RunAlgorithm";
import { ExecutionMonitor } from "./ExecutionMonitor";


const ProcessFlow = ({ docked, record, onSubjectPicked, height }) => {
  const formDataType = useRef(DataType.from({
    name: 'Process',
    schema: {},
    [Config]: {
      formViewComponent: ClickAndRun
    }
  }));

  const handleFormSubmit = (_, value) => API.post(
    'setup', 'flow', record.id, 'digest', {}
  );

  return (
    <div className="relative">
      <FormEditor docked={docked}
                  dataType={formDataType.current}
                  height={height}
                  submitIcon={<ProcessIcon />}
                  onFormSubmit={handleFormSubmit}
                  onSubjectPicked={onSubjectPicked}
                  successControl={ExecutionMonitor}
                  noSubmitButton={true}
                  noJSON={true} />
    </div>
  );
};

export default ActionRegistry.register(ProcessFlow, {
  kind: ActionKind.member,
  icon: ProcessIcon,
  title: 'Process',
  arity: 1,
  onlyFor: [{ namespace: 'Setup', name: 'Flow' }]
});
