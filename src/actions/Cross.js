import React, { useEffect, useRef } from 'react';
import ActionRegistry, { CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import { switchMap } from "rxjs/operators";
import { useContainerContext } from "./ContainerContext";
import CrossIcon from "@material-ui/icons/SwapHoriz";
import { FormRootValue } from "../services/FormValue";
import { of } from "rxjs";
import { ExecutionMonitor } from "./ExecutionMonitor";
import { Config } from "../common/Symbols";
import ToggleEnumControl from "../components/ToggleEnumControl";
import { OriginsColors } from "../components/OriginsColors";
import { makeStyles } from "@material-ui/core";

const useOriginStyles = makeStyles(theme => ({
    option: {
        margin: theme.spacing(1)
    },
    default: {
        borderColor: theme.palette.text.disabled,
        '&.selected': {
            backgroundColor: theme.palette.text.disabled,
            color: theme.palette.getContrastText(theme.palette.text.disabled),
            fontWeight: 700
        }
    },
    ...Object.keys(OriginsColors).reduce(
        (cls, origin) => (cls[origin] = {
            borderColor: OriginsColors[origin],
            '&.selected': {
                backgroundColor: OriginsColors[origin],
                color: theme.palette.getContrastText(OriginsColors[origin]),
                fontWeight: 700
            }
        }) && cls, {}
    )
}));

const Cross = ({ docked, dataType, onSubjectPicked, height }) => {

    const [state, setState] = useSpreadState();

    const optionsClasses = useOriginStyles();

    const [containerState, setContainerState] = useContainerContext();

    const { selectedItems, selector } = containerState;

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Cross" });

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
                    },
                    [Config]: {
                        fields: {
                            origin: {
                                control: ToggleEnumControl,
                                controlProps: {
                                    optionsClasses
                                }
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
                            successControl={ExecutionMonitor}
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
    crud: [CRUD.update],
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
            "name": "AlgorithmValidator"
        },
        {
            "namespace": "Setup",
            "name": "EdiValidator"
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
    ],
    group: 3
});
