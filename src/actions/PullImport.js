import React, { useRef } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { DataType } from "../services/DataTypeService";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import DoneIcon from "@material-ui/icons/Done";
import { Config } from "../common/Symbols";
import { FormRootValue } from "../services/FormValue";
import PullImportIcon from "@material-ui/icons/SaveAlt";
import DataControl from "../components/DataControl";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

function SuccessImport() {
    return (
        <SuccessAlert mainIcon={DoneIcon}/>
    );
}

function importDataTypeFormFor(targetDataType) {
    const dt = DataType.from({
        name: 'Pull Import',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'object'
                }
            }
        }
    });

    dt[Config] = {
        fields: {
            data: {
                control: DataControl
            }
        }
    };

    return dt;
}

const PullImport = ({ docked, dataType, onSubjectPicked, height }) => {

    const value = useRef(new FormRootValue({
        data_type: {
            id: dataType.id,
            _reference: true
        }
    }));

    const formDataType = useRef(importDataTypeFormFor(dataType));

    const handleFormSubmit = (_, value) => {
        const { data_type, data } = value.get();
        let formData;
        if (data.type === 'file') {
            if ((formData = data.file)) {
                formData = Object.values(formData)[0];
            }
        } else {
            formData = data.plain_data;
        }
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!formData) {
                    error = { ...error, data: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }

                return API.post('setup', 'data_type', data_type.id, 'digest', 'pull_import', formData);
            })
        );
    };

    return (
        <div className="relative">
            <FormEditor docked={docked}
                        dataType={formDataType.current}
                        height={height}
                        submitIcon={<PullImportIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessImport}
                        value={value.current}/>
        </div>
    );
};

export default ActionRegistry.register(PullImport, {
    kind: ActionKind.collection,
    icon: PullImportIcon,
    title: 'Pull Import',
    crud: [CRUD.create, CRUD.update],
    onlyFor: [
        {
            "namespace": "Setup",
            "name": "Namespace"
        },
        {
            "namespace": "Setup",
            "name": "Flow"
        },
        {
            "namespace": "Setup",
            "name": "ConnectionRole"
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
            "name": "ErbTemplate"
        },
        {
            "namespace": "Setup",
            "name": "HandlebarsTemplate"
        },
        {
            "namespace": "Setup",
            "name": "LiquidTemplate"
        },
        {
            "namespace": "Setup",
            "name": "PrawnTemplate"
        },
        {
            "namespace": "Setup",
            "name": "RubyTemplate"
        },
        {
            "namespace": "Setup",
            "name": "XsltTemplate"
        },
        {
            "namespace": "Setup",
            "name": "ParserTransformation"
        },
        {
            "namespace": "Setup",
            "name": "RubyParser"
        },
        {
            "namespace": "Setup",
            "name": "UpdaterTransformation"
        },
        {
            "namespace": "Setup",
            "name": "RubyUpdater"
        },
        {
            "namespace": "Setup",
            "name": "ConverterTransformation"
        },
        {
            "namespace": "Setup",
            "name": "HandlebarsConverter"
        },
        {
            "namespace": "Setup",
            "name": "LiquidConverter"
        },
        {
            "namespace": "Setup",
            "name": "MappingConverter"
        },
        {
            "namespace": "Setup",
            "name": "RubyConverter"
        },
        {
            "namespace": "Setup",
            "name": "XsltConverter"
        },
        {
            "namespace": "Setup",
            "name": "LegacyTranslator"
        },
        {
            "namespace": "Setup",
            "name": "Converter"
        },
        {
            "namespace": "Setup",
            "name": "Parser"
        },
        {
            "namespace": "Setup",
            "name": "Renderer"
        },
        {
            "namespace": "Setup",
            "name": "Updater"
        },
        {
            "namespace": "Setup",
            "name": "Event"
        },
        {
            "namespace": "Setup",
            "name": "Scheduler"
        },
        {
            "namespace": "Setup",
            "name": "Observer"
        },
        {
            "namespace": "Setup",
            "name": "Application"
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
            "name": "AlgorithmValidator"
        },
        {
            "namespace": "Setup",
            "name": "EdiValidator"
        },
        {
            "namespace": "Setup",
            "name": "Algorithm"
        },
        {
            "namespace": "Setup",
            "name": "Snippet"
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
            "name": "Authorization"
        },
        {
            "namespace": "Setup",
            "name": "BaseOauthAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "Oauth2Authorization"
        },
        {
            "namespace": "Setup",
            "name": "AppAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "LazadaAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "OauthAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "AwsAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "BasicAuthorization"
        },
        {
            "namespace": "Setup",
            "name": "GenericCallbackAuthorization"
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
            "name": "OauthProvider"
        },
        {
            "namespace": "Setup",
            "name": "GenericAuthorizationProvider"
        },
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
            "name": "Collection"
        }
    ]
});
