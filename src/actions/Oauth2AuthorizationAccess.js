import React, { useEffect, useRef } from 'react';
import AccessIcon from '@material-ui/icons/VpnKey';
import ActionRegistry, { ActionKind } from './ActionRegistry';
import FormEditor from '../components/FormEditor';
import { FormRootValue } from "../services/FormValue";
import { DataType } from "../services/DataTypeService";
import { Config, FETCHED, Status } from "../common/Symbols";
import SuccessAlert from "./SuccessAlert";
import { useSpreadState } from "../common/hooks";
import LinearProgress from "@material-ui/core/LinearProgress";
import StringControl from "../components/StringControl";
import lazy from "../components/lazy";
import { useContainerContext } from "./ContainerContext";
import { switchMap, tap } from "rxjs/operators";
import { of } from "rxjs";

const Success = () => <SuccessAlert mainIcon={AccessIcon}/>;

function Oauth2AuthorizationAccess({ docked, dataType, record, onSubjectPicked, onUpdate, height }) {

    const [state, setState] = useSpreadState();

    const { formValue } = state;

    const containerContext = useContainerContext();

    const formDataType = useRef(DataType.from({
        name: 'Access',
        schema: {
            type: 'object',
            properties: {
                token_type: {
                    type: 'string'
                },
                access_token: {
                    type: 'string'
                },
                token_span: {
                    type: 'integer'
                },
                refresh_token: {
                    type: 'string'
                },
                id_token: {
                    type: 'string'
                },
                authorized_at: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },
        [Config]: {
            fields: {
                access_token: {
                    controlProps: {
                        multiline: true
                    }
                },
                refresh_token: {
                    controlProps: {
                        multiline: true
                    }
                },
                id_token: {
                    controlProps: {
                        multiline: true
                    }
                }
            }
        }
    }));

    useEffect(() => {
        const subscription = dataType.get(record.id, {
            viewport: '{id token_type token_span access_token refresh_token id_token authorized_at}'
        }).subscribe(
            data => {
                data[FETCHED] = true;
                setState({ formValue: new FormRootValue(data) });
            }
        );

        return () => subscription.unsubscribe();
    }, [record, dataType]);

    if (!formValue) {
        return <LinearProgress className="full-width"/>;
    }

    const handleFormSubmit = ({}, value) => {
        return containerContext.confirm({
            title: 'Access UPDATE alert',
            message: 'The authorization access information will be updated with this action!',
        }).pipe(
            switchMap(ok => {
                if (ok) {
                    return dataType.post(value.get(), {
                        add_only: true,
                        polymorphic: true
                    });
                }

                return of(false)
            })
        )
    };

    return <FormEditor docked={docked}
                       dataType={formDataType.current}
                       height={height}
                       submitIcon={<AccessIcon/>}
                       onSubjectPicked={onSubjectPicked}
                       onUpdate={onUpdate}
                       value={formValue}
                       onFormSubmit={handleFormSubmit}
                       successControl={Success}/>;
}

export default ActionRegistry.register(Oauth2AuthorizationAccess, {
    kind: ActionKind.member,
    icon: AccessIcon,
    title: 'Access',
    arity: 1,
    onlyFor: [
        {
            'namespace': 'Setup',
            'name': 'Oauth2Authorization'
        },
        {
            'namespace': 'Setup',
            'name': 'AppAuthorization'
        },
        {
            'namespace': 'Setup',
            'name': 'LazadaAuthorization'
        }
    ]
});
