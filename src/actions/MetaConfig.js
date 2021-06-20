import React, { useEffect } from 'react';
import ActionRegistry, { ActionKind, CRUD } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { Config, FETCHED } from "../common/Symbols";
import { map, switchMap, tap } from "rxjs/operators";
import { FormRootValue } from "../services/FormValue";
import { underscore } from "../common/strutls";
import MetaConfigIcon from "@material-ui/icons/AutoFixHigh";
import Random from "../util/Random";
import { of } from "rxjs";
import EmbeddedAppService from "../services/EnbeddedAppService";

export function SuccessAppConfig() {

    return (
        <SuccessAlert mainIcon={MetaConfigIcon}/>
    );
}

const META_CONFIG_PARAMETER = 'meta_config';

const MetaConfig = ({ docked, dataType, record, onSubjectPicked, height }) => {
    const [state, setState] = useSpreadState();

    const { formDataType, value } = state;

    useEffect(() => {
        const subscription = dataType.get(record.id, {
            viewport: '{configuration}',
            include_id: true
        }).pipe(
            map(({ configuration: { meta_config } }) => meta_config || [])
        ).subscribe(metaConfig => {
                const formDataType = DataType.from({
                    name: 'Meta Config',
                    schema: {
                        properties: {
                            embedded_apps: {
                                type: 'array',
                                items: {
                                    title: 'Embedded App',
                                    type: 'object',
                                    properties: {
                                        title: {
                                            type: 'string'
                                        },
                                        url: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    [Config]: {
                        fields: {
                            embedded_apps: {
                                seed: () => ({ id: Random.string() })
                            }
                        }
                    }
                });
                metaConfig[FETCHED] = true;
                setState({
                    formDataType,
                    value: new FormRootValue(metaConfig)
                });
            }
        );

        return () => subscription.unsubscribe();
    }, [record.id, dataType]);


    const handleFormSubmit = (_, value) => dataType.get(record.id, {
        viewport: '{application_parameters configuration}',
        include_id: true
    }).pipe(
        switchMap(data => {
            const { application_parameters, configuration } = data;
            if (!(application_parameters || []).find(
                ({ name }) => name === META_CONFIG_PARAMETER
            )) {
                return dataType.post({
                    id: record.id,
                    application_parameters: [
                        {
                            name: META_CONFIG_PARAMETER,
                            type: 'object'
                        }
                    ]
                }, {
                    add_only: true,
                    polymorphic: true
                }).pipe(
                    map(() => configuration)
                );
            }

            return of(configuration);
        }),
        switchMap(configuration => API.post(
            underscore(dataType.namespace), underscore(dataType.name), record.id, 'digest', 'config', {
                ...configuration,
                meta_config: value.get()
            }
        )),
        tap(() => EmbeddedAppService.update(value.get().embedded_apps)),
        map(() => ({}))
    );

    if (formDataType) {
        return (
            <div className="relative">
                <FormEditor docked={docked}
                            dataType={formDataType}
                            height={height}
                            submitIcon={<MetaConfigIcon component="svg"/>}
                            onFormSubmit={handleFormSubmit}
                            onSubjectPicked={onSubjectPicked}
                            successControl={SuccessAppConfig}
                            value={value}/>
            </div>
        );
    }

    return <Loading/>;
};

export default ActionRegistry.register(MetaConfig, {
    key: 'embedded_apps',
    kind: ActionKind.member,
    arity: 1,
    icon: MetaConfigIcon,
    title: 'Meta Config',
    crud: [CRUD.update],
    onlyFor: [
        {
            "namespace": "Cenit",
            "name": "BuildInApp"
        }
    ],
    onlyForMembers: [
        {
            namespace: "Cenit",
            name: "Admin"
        }
    ]
});
