import React, { useEffect } from 'react';
import RunIcon from '@material-ui/icons/PlayCircleFilled';
import RunActionIcon from '@material-ui/icons/PlayArrow';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import Alert from "./Alert";

function parametersSchema(parameters) {
    const properties = {};
    const requiredProperties = [];
    const schema = { type: 'object', properties, required: requiredProperties };
    parameters.forEach(({ name, type, required }) => {
        const propertySchema = properties[name] = {};
        if (type) {
            propertySchema.type = type;
        }
        if (required) {
            requiredProperties.push(name);
        }
    });
    return schema;
}

function SuccessRun() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

const RunAlgorithm = ({ docked, dataType, record, onSubjectPicked, height }) => {
    const [state, setState] = useSpreadState();

    const { parameters, paramsDataType } = state;

    useEffect(() => {
        const subscription = dataType.get(record.id, {
            viewport: '{parameters}'
        }).subscribe(
            ({ parameters }) => {
                const paramsDataType = parameters.length
                    ? DataType.from({
                        name: 'Parameters',
                        schema: parametersSchema(parameters)
                    })
                    : null;
                setState({ parameters, paramsDataType });
            }
        );

        return () => subscription.unsubscribe();
    }, [dataType, record]);

    const handleFormSubmit = (_, value) => API.post(
        'setup', 'algorithm', record.id, 'digest', value.get()
    );

    if (parameters) {
        if (paramsDataType) {
            return (
                <div className="relative">
                    <FormEditor docked={docked}
                                dataType={paramsDataType}
                                height={height}
                                submitIcon={<RunActionIcon/>}
                                onFormSubmit={handleFormSubmit}
                                onSubjectPicked={onSubjectPicked}
                                successControl={SuccessRun}/>
                </div>
            );
        }

        return <Alert message="Coming soon..." title="Algorithm with no parameters"/>;
    }

    return <Loading/>;
};

export default ActionRegistry.register(RunAlgorithm, {
    kind: ActionKind.member,
    icon: RunIcon,
    title: 'Run',
    arity: 1,
    onlyFor: [{ namespace: 'Setup', name: 'Algorithm' }]
});
