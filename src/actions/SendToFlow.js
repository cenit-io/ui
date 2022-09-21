import React, { useRef, useEffect } from 'react';
import ActionRegistry from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import { useContainerContext } from "./ContainerContext";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ExecutionMonitor } from "./ExecutionMonitor";

const SendToFlowIcon = () => (
  <SvgIcon style={{ display: 'block', transform: 'scale(-1,1)' }}>
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </SvgIcon>
);

function sendToFlowDataTypeFormFor(sourceDataType) {
  const dt = DataType.from({
    name: 'Send to Flow',
    schema: {
      type: 'object',
      properties: {
        flow: {
          referenced: true,
          $ref: {
            namespace: 'Setup',
            name: 'Flow'
          }
        }
      }
    }
  });

  dt[Config] = {
    fields: {
      flow: {
        selector: {
          $or: [
            { data_type_id: { $exists: false } },
            { data_type_id: sourceDataType.id }
          ]
        }
      }
    }
  };

  return dt;
}

const SendToFlow = ({ docked, dataType, onSubjectPicked, height }) => {

  const [containerState, setContainerState] = useContainerContext();

  const { selectedItems, selector } = containerState;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Send to Flow" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  const value = useRef(new FormRootValue({
    data_type: {
      id: dataType.id,
      _reference: true
    },
    selector: selectedItems.length
      ? { _id: { $in: selectedItems.map(({ id }) => id) } }
      : selector || {}
  }));

  const formDataType = useRef(sendToFlowDataTypeFormFor(dataType));

  const handleFormSubmit = (_, value) => {
    const { data_type, selector, flow } = value.get();
    return of(true).pipe(
      switchMap(() => {
        let error;
        if (!flow?.id) {
          error = { flow: ['is required'] };
        }
        if (error) {
          throw ({ response: { data: error } });
        }
        return API.post('setup', 'flow', flow.id, 'digest', {
          data_type_id: data_type.id,
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
                  submitIcon={<SendToFlowIcon />}
                  onFormSubmit={handleFormSubmit}
                  onSubjectPicked={onSubjectPicked}
                  successControl={ExecutionMonitor}
                  value={value.current} />
    </div>
  );
};

export default ActionRegistry.register(SendToFlow, {
  bulkable: true,
  icon: SendToFlowIcon,
  title: 'Send to Flow'
});
