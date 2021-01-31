import React, { useEffect, useRef } from 'react';
import ActionRegistry from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { switchMap } from "rxjs/operators";
import { useContainerContext } from "./ContainerContext";
import CrossIcon from "@material-ui/icons/SwapHoriz";
import { FormRootValue } from "../services/FormValue";
import { of } from "rxjs";


function SuccessExport() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

const Cross = ({ docked, dataType, onSubjectPicked, height }) => {

    const [state, setState] = useSpreadState();

    const [containerState] = useContainerContext();

    const { selectedItems } = containerState;

    const value = useRef(new FormRootValue({
        data_type: {
            id: dataType.id,
            _reference: true
        },
        selector: selectedItems.length
            ? { _id: { $in: selectedItems.map(({ id }) => id) } }
            : {}
    }));

    const { formDataType } = state;

    useEffect(() => {
        const subscription = API.get('setup', 'data_type', dataType.id, 'digest', 'origins').subscribe(
            origins => setState({
                formDataType: DataType.from({
                    name: 'Origins',
                    schema: {
                        type: 'object',
                        properties: {
                            origin: {
                                type: 'string',
                                enum: origins
                            }
                        }
                    }
                })
            })
        );

        return () => subscription.unsubscribe();
    }, [dataType]);

    const handleFormSubmit = (_, value) => {
        const { data_type, selector, origin } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!origin) {
                    error = { origin: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return API.post('setup', 'data_type', data_type.id, 'digest', 'cross', {
                    selector,
                    origin
                });
            })
        );
    };

    if (formDataType) {
        return (
            <div className="relative">
                <FormEditor docked={docked}
                            dataType={formDataType}
                            height={height}
                            submitIcon={<CrossIcon/>}
                            onFormSubmit={handleFormSubmit}
                            onSubjectPicked={onSubjectPicked}
                            successControl={SuccessExport}
                            value={value.current}/>
            </div>
        );
    }

    return <Loading/>;
};

export default ActionRegistry.register(Cross, {
    bulkable: true,
    icon: CrossIcon,
    title: 'Cross',
    onlyFor: [
        {
            "namespace": "Setup",
            "name": "RemoteOauthClient"
        },
        {
            "namespace": "Setup",
            "name": "GenericAuthorizationClient"
        },
        {
            "namespace": "Setup",
            "name": "Oauth2Scope"
        },
        {
            "namespace": "Setup",
            "name": "Algorithm"
        },
        {
            "namespace": "Setup",
            "name": "Resource"
        },
        {
            "namespace": "Setup",
            "name": "Operation"
        },
        {
            "namespace": "Setup",
            "name": "PlainWebhook"
        },
        {
            "namespace": "Setup",
            "name": "Connection"
        },
        {
            "namespace": "Setup",
            "name": "Flow"
        },
        {
            "namespace": "Setup",
            "name": "Snippet"
        },
        {
            "namespace": "Setup",
            "name": "ApiSpec"
        },
        {
            "namespace": "Setup",
            "name": "Translator"
        },
        {
            "namespace": "Setup",
            "name": "Template"
        },
        {
            "namespace": "Setup",
            "name": "ParserTransformation"
        },
        {
            "namespace": "Setup",
            "name": "UpdaterTransformation"
        },
        {
            "namespace": "Setup",
            "name": "ConverterTransformation"
        },
        {
            "namespace": "Setup",
            "name": "AuthorizationProvider"
        },
        {
            "namespace": "Setup",
            "name": "BaseOauthProvider"
        },
        {
            "namespace": "Setup",
            "name": "Oauth2Provider"
        },
        {
            "namespace": "Setup",
            "name": "DataType"
        },
        {
            "namespace": "Setup",
            "name": "JsonDataType"
        },
        {
            "namespace": "Setup",
            "name": "CenitDataType"
        },
        {
            "namespace": "Setup",
            "name": "FileDataType"
        },
        {
            "namespace": "Setup",
            "name": "Validator"
        },
        {
            "namespace": "Setup",
            "name": "Schema"
        },
        {
            "namespace": "Setup",
            "name": "CustomValidator"
        },
        {
            "namespace": "Setup",
            "name": "XsltValidator"
        },
        {
            "namespace": "Setup",
            "name": "Collection"
        },
        {
            "namespace": "Setup",
            "name": "Scheduler"
        },
        {
            "namespace": "Setup",
            "name": "CrossSharedCollection"
        }
    ]
});
