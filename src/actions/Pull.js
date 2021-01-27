import React, { useEffect, useRef } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import PullIcon from "@material-ui/icons/SaveAlt";
import DataControl from "../components/DataControl";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";
import ShareIcon from "@material-ui/core/SvgIcon/SvgIcon";
import { useSpreadState } from "../common/hooks";
import { ClickAndRun } from "./RunAlgorithm";
import Loading from "../components/Loading";
import { underscore } from "../common/strutls";


function SuccessImport() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function pullParametersSchema(pull_parameters) {
    const properties = {};
    const requiredProperties = [];
    const schema = { type: 'object', properties, required: requiredProperties };
    pull_parameters.forEach(({ id, label, type, many, required, description }) => {
        const propertySchema = properties[id] = { label, description };
        if (many) {
            propertySchema.type = 'array';
            if (type) {
                propertySchema.items = { type }
            }
        } else if (type) {
            propertySchema.type = type;
        }
        if (required) {
            requiredProperties.push(id);
        }
    });
    if (!requiredProperties.length) {
        delete schema.required;
    }
    return schema;
}

const Pull = ({ dataType, docked, record, onSubjectPicked, height }) => {

    const [state, setState] = useSpreadState();

    const value = useRef(new FormRootValue({}));

    const { pull_parameters, formDataType } = state;

    useEffect(() => {
        const subscription = dataType.get(record.id, {
            viewport: '{pull_parameters {id label type many required description}}'
        }).subscribe(
            ({ pull_parameters }) => {
                console.log('pull p', pull_parameters);
                pull_parameters = pull_parameters || [];
                const formDataType = DataType.from({
                    name: 'Pull',
                    schema: pullParametersSchema(pull_parameters)
                });

                if (!pull_parameters.length) {
                    formDataType[Config] = {
                        formViewComponent: ClickAndRun
                    };
                }

                setState({ pull_parameters, formDataType });
            }
        );

        return () => subscription.unsubscribe();
    }, [dataType, record.id]);

    const handleFormSubmit = (_, formValue) => {
        const value = formValue.get();
        const pp = {};
        pull_parameters.forEach(({ id }) => pp[id] = value[id]);
        const formData = { pull_parameters: pp };
        return of(true).pipe(
            switchMap(() => {
                let error;
                pull_parameters.forEach(p => {
                    if (p.required && !pp[p.id]) {
                        error = { [p.id]: ['is required'] };
                    }
                })
                if (error) {
                    throw ({ response: { data: error } });
                }

                const slug = underscore(dataType.name);

                return API.post('setup', slug, record.id, 'digest', 'pull', formData);
            })
        );
    };

    if (formDataType) {
        return (
            <div className="relative">
                <FormEditor docked={docked}
                            dataType={formDataType}
                            height={height}
                            submitIcon={<PullIcon/>}
                            onFormSubmit={handleFormSubmit}
                            onSubjectPicked={onSubjectPicked}
                            successControl={SuccessImport}
                            value={value.current}
                            noSubmitButton={!pull_parameters.length}
                            noJSON={!pull_parameters.length}/>
            </div>
        );
    }

    return <Loading/>;
};

export default ActionRegistry.register(Pull, {
    kind: ActionKind.member,
    arity: 1,
    icon: PullIcon,
    title: 'Pull',
    onlyFor: [
        {
            "namespace": "Setup",
            "name": "CrossSharedCollection"
        },
        {
            "namespace": "Setup",
            "name": "ApiSpec"
        }]
});
