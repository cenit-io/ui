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

const Success = () => <SuccessAlert mainIcon={AccessIcon} />;

function Oauth1AuthorizationAccess({ docked, dataType, record, onSubjectPicked, onUpdate, height }) {

  const [state, setState] = useSpreadState();

  const { formValue } = state;

  const containerContext = useContainerContext();

  const formDataType = useRef(DataType.from({
    name: 'Access',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string'
        },
        access_token_secret: {
          type: 'string'
        },
        realm_id: {
          type: 'string'
        },
        token_span: {
          type: 'integer'
        },
        authorized_at: {
          type: 'string',
          format: 'date-time'
        }
      }
    },
  }));

  useEffect(() => {
    const subscription = dataType.get(record.id, {
      viewport: '{id token_span access_token access_token_secret realm_id authorized_at}'
    }).subscribe(
      data => {
        data[FETCHED] = true;
        setState({ formValue: new FormRootValue(data) });
      }
    );

    return () => subscription.unsubscribe();
  }, [record, dataType]);

  if (!formValue) {
    return <LinearProgress className="full-width" />;
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
                     submitIcon={<AccessIcon />}
                     onSubjectPicked={onSubjectPicked}
                     onUpdate={onUpdate}
                     value={formValue}
                     onFormSubmit={handleFormSubmit}
                     successControl={Success} />;
}

export default ActionRegistry.register(Oauth1AuthorizationAccess, {
  kind: ActionKind.member,
  icon: AccessIcon,
  title: 'Access',
  arity: 1,
  onlyFor: [
    {
      'namespace': 'Setup',
      'name': 'OauthAuthorization'
    }
  ]
});
