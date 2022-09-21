import React, { useEffect, useRef } from 'react';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { FETCHED } from "../common/Symbols";
import { switchMap } from "rxjs/operators";
import { FormRootValue } from "../services/FormValue";
import SvgIcon from "@material-ui/core/SvgIcon";
import Random from "../util/Random";
import { of } from "rxjs";
import { DataType } from "../services/DataTypeService";
import { underscore } from "../common/strutls";
import { useContainerContext } from './ContainerContext';

const RegistrationIcon = () => (
  <SvgIcon>
    <g>
      <rect fill="none" height="24" width="24" />
    </g>
    <g>
      <g>
        <rect height="4" width="4" x="10" y="4" />
        <rect height="4" width="4" x="4" y="16" />
        <rect height="4" width="4" x="4" y="10" />
        <rect height="4" width="4" x="4" y="4" />
        <rect height="4" width="4" x="16" y="4" />
        <polygon points="11,17.86 11,20 13.1,20 19.08,14.03 16.96,11.91" />
        <polygon points="14,12.03 14,10 10,10 10,14 12.03,14" />
        <path
          d="M20.85,11.56l-1.41-1.41c-0.2-0.2-0.51-0.2-0.71,0l-1.06,1.06l2.12,2.12l1.06-1.06C21.05,12.07,21.05,11.76,20.85,11.56z" />
      </g>
    </g>
  </SvgIcon>
);

export function RegistrationSuccess() {

  return (
    <SuccessAlert mainIcon={RegistrationIcon} />
  );
}

const RegisterApp = ({ docked, record, onSubjectPicked, height }) => {
  const [state, setState] = useSpreadState({
    retry: Random.string()
  });

  const [_, setContainerState] = useContainerContext();

  const formDataType = useRef(DataType.from({
    name: 'Registration',
    schema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string'
        },
        oauth_name: {
          type: 'string'
        }
      }
    }
  }));

  const { value } = state;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Register" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    const subscription = API.get(
      'setup', 'application', record.id, 'digest', 'registration'
    ).subscribe(config => {
      config[FETCHED] = true;
      setState({ value: new FormRootValue(config || {}) });
    }); // TODO On error?

    return () => subscription.unsubscribe();
  }, [record]);

  const handleFormSubmit = (_, value) => {
    let { oauth_name, slug } = value.get();
    if (slug === undefined) {
      slug = null;
    }
    if (slug !== null) {
      slug = (slug || '').trim();
    }
    if (oauth_name === undefined) {
      oauth_name = null;
    }
    return of(true).pipe(
      switchMap(() => {
        let error;
        if (slug !== null) {
          if (!slug) {
            error = { slug: ["can't be blank"] };
          } else if (underscore(slug) !== slug) {
            error = { slug: ["is not valid"] };
          }
        }
        if (oauth_name !== null && !oauth_name) {
          error = { ...error, oauth_name: ["can't be blank"] };
        }
        if (error) {
          throw ({ response: { data: error } });
        }

        return API.post('setup', 'application', record.id, 'digest', 'registration', {
          slug,
          oauth_name
        });
      })
    );
  };

  const handleCancel = () => {
    setContainerState({ actionKey: 'index' });
  }

  if (value) {
    return (
      <FormEditor key={record.id}
                  docked={docked}
                  dataType={formDataType.current}
                  height={height}
                  submitIcon={<RegistrationIcon />}
                  onFormSubmit={handleFormSubmit}
                  onSubjectPicked={onSubjectPicked}
                  successControl={RegistrationSuccess}
                  cancelEditor={handleCancel}
                  value={value} />
    );
  }

  return <Loading />;
};

export default ActionRegistry.register(RegisterApp, {
  kind: ActionKind.member,
  icon: RegistrationIcon,
  title: 'Register',
  arity: 1,
  onlyFor: [{ namespace: 'Setup', name: 'Application' }]
});
