import React, { useRef, useEffect } from 'react';
import AuthorizeIcon from '@material-ui/icons/VerifiedUser';
import ActionRegistry, { ActionKind } from './ActionRegistry';
import { makeStyles } from '@material-ui/core';
import FormEditor from '../components/FormEditor';
import InfoAlert from "./InfoAlert";
import Button from "@material-ui/core/Button";
import OpenIcon from '@material-ui/icons/OpenInNew';
import { FormRootValue } from "../services/FormValue";
import { DataType } from "../services/DataTypeService";
import { Config as ConfigSymbol } from "../common/Symbols";
import { of } from "rxjs";
import { switchMap, map } from "rxjs/operators";
import SuccessAlert from "./SuccessAlert";
import { Config } from "../services/AuthorizationService";
import { useContainerContext } from './ContainerContext';

const useStyles = makeStyles(() => ({
    link: {
        textDecoration: 'none'
    }
}));

const SuccessAuthorization = () => <SuccessAlert mainIcon={AuthorizeIcon}/>;

function BasicAuthorizationForm({ docked, dataType, record, onSubjectPicked, onUpdate, height }) {

    const [_,setContainerState] = useContainerContext();

    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Authorize" });

        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, []);

    const value = useRef(new FormRootValue(record));

    const formDataType = useRef(DataType.from({
        name: 'Credentials',
        schema: {
            type: 'object',
            properties: {
                username: {
                    type: 'string'
                },
                password: {
                    type: 'string'
                }
            }
        },
        [ConfigSymbol]: {
            fields: {
                password: {
                    controlProps: {
                        type: 'password'
                    }
                }
            }
        }
    }));

    const handleFormSubmit = (_, value) => {
        const { username, password } = value.get();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!username) {
                    error = { username: ['is required'] };
                }
                if (!password) {
                    error = { ...error, password: ['is required'] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }
                return dataType.post(value.get());
            }),
            map(() => value.get())
        );
    };

    return <FormEditor docked={docked}
                       dataType={formDataType.current}
                       height={height}
                       submitIcon={<AuthorizeIcon/>}
                       onSubjectPicked={onSubjectPicked}
                       onUpdate={onUpdate}
                       value={value.current}
                       onFormSubmit={handleFormSubmit}
                       successControl={SuccessAuthorization}/>;
}

const Authorize = (props) => {

    const { dataType, record } = props;

    const classes = useStyles();

    if (dataType.name === 'BasicAuthorization') {
        return <BasicAuthorizationForm {...props}/>
    }

    return (
        <InfoAlert mainIcon={AuthorizeIcon}
                   title="Redirection Alert"
                   message="To start the authorization process you will be redirected to an other location in a new browser view">
            <a className={classes.link}
               href={`${Config.getCenitHost()}/authorization/${record.id}/authorize`}
               target="_blank">
                <Button variant="outlined"
                        color="primary"
                        endIcon={<OpenIcon/>}>
                    Authorize
                </Button>
            </a>
        </InfoAlert>
    )
};

export default ActionRegistry.register(Authorize, {
    kind: ActionKind.member,
    icon: AuthorizeIcon,
    title: 'Authorize',
    arity: 1,
    onlyFor: [
        {
            'namespace': 'Setup',
            'name': 'Authorization'
        },
        {
            'namespace': 'Setup',
            'name': 'BaseOauthAuthorization'
        },
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
        },
        {
            'namespace': 'Setup',
            'name': 'OauthAuthorization'
        },
        {
            'namespace': 'Setup',
            'name': 'AwsAuthorization'
        },
        {
            'namespace': 'Setup',
            'name': 'BasicAuthorization'
        },
        {
            'namespace': 'Setup',
            'name': 'GenericCallbackAuthorization'
        }
    ]
});
