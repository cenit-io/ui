import React, { useEffect } from 'react';
import RunIcon from '@material-ui/icons/PlayCircleFilled';
import RunActionIcon from '@material-ui/icons/PlayArrow';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import { Config } from "../common/Symbols";
import LoadingButton from "../components/LoadingButton";
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs";
import { ExecutionMonitor } from "./ExecutionMonitor";
import Alert from "./Alert";
import { useContainerContext } from './ContainerContext';
import Show from './Show';
import Random from '../util/Random';

function parametersSchema(parameters) {
  const properties = {};
  const requiredProperties = [];
  const schema = { type: 'object', properties, required: requiredProperties };
  parameters.forEach(({ name, type, required, many }) => {
    const propertySchema = properties[name] = {};
    if (many) {
      propertySchema.type = 'array';
    }
    if (type) {
      if (many) {
        propertySchema.items = type;
      } else {
        propertySchema.type = type;
      }
    }
    if (required && name !== 'task') {
      requiredProperties.push(name);
    }
  });
  if (!requiredProperties.length) {
    delete schema.required;
  }
  return schema;
}

export function ClickAndRun({ onFormSubmit, dataType, value, height }) {
  const [state, setState] = useSpreadState();

  const { submitting, success } = state;

  const containerContext = useContainerContext();
  const [, setContainerState] = containerContext;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Run" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  const handleCancel = () => {
    setContainerState({
      selectedItems: [],
      landingActionKey: Show.key,
      actionKey: Show.key,
      actionComponentKey: Random.string(),
    });
  };

  useEffect(() => {
    if (submitting) {
      const subscription = onFormSubmit(dataType, value).pipe(
        tap(() => setState({ success: true })),
        catchError(() => {
          setState({ submitting: false });
          return of(null);
        })
      ).subscribe();

      return () => subscription.unsubscribe();
    }
  }, [submitting]);

  const submit = () => setState({ submitting: true });

  return (
    <div className="flex full-width full-height align-items-center justify-content-center"
         style={{ height: `calc(${height} - 64px)` }}>
      <LoadingButton loading={submitting}
                     onClick={submit}
                     success={success}
                     onClickCancel={handleCancel}
                     actionIcon={<RunActionIcon component="svg" />} />
    </div>
  );
}

const RunAlgorithm = ({ docked, dataType, record, onSubjectPicked, height }) => {
  const [state, setState] = useSpreadState();

  const { parameters, paramsDataType, error } = state;

  useEffect(() => {
    const subscription = dataType.get(record.id, {
      viewport: '{parameters}'
    }).subscribe(
      alg => {
        const parameters = alg?.parameters;
        if (parameters) {
          const paramsDataType = DataType.from({
            name: 'Parameters',
            schema: parametersSchema(parameters)
          });

          if (!parameters.length) {
            paramsDataType[Config] = {
              formViewComponent: ClickAndRun
            };
          }

          setState({ parameters, paramsDataType });
        } else {
          setState({ error: 'Algorithm not found!' })
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dataType, record]);

  const handleFormSubmit = (_, value) => API.post(
    'setup', 'algorithm', record.id, 'digest', value.get()
  );

  if (error) {
    return <Alert message={error} />;
  }

  if (parameters && paramsDataType) {
    return (
      <div className="relative">
        <FormEditor docked={docked}
                    dataType={paramsDataType}
                    height={height}
                    submitIcon={<RunActionIcon component="svg" />}
                    onFormSubmit={handleFormSubmit}
                    onSubjectPicked={onSubjectPicked}
                    successControl={ExecutionMonitor}
                    noSubmitButton={!parameters.length}
                    noJSON={!parameters.length} />
      </div>
    );
  }

  return <Loading />;
};

export default ActionRegistry.register(RunAlgorithm, {
  kind: ActionKind.member,
  icon: RunIcon,
  title: 'Run',
  arity: 1,
  onlyFor: [{ namespace: 'Setup', name: 'Algorithm' }]
});
