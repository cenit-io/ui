import React, { useEffect } from 'react';
import ConfigIcon from '@material-ui/icons/Settings';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { Config, FETCHED } from "../common/Symbols";
import { map } from "rxjs/operators";
import { FormRootValue } from "../services/FormValue";
import { capitalize, underscore } from "../common/strutls";
import { useContainerContext } from './ContainerContext';

export function SuccessAppConfig() {

  return (
    <SuccessAlert mainIcon={ConfigIcon} />
  );
}

const SimpleTypes = [
  'integer',
  'number',
  'boolean',
  'string',
  'object'
];

function parameterSchema({ type, many, group, description }) {
  let schema;

  type = (type || '').trim();

  if (type) {
    if (SimpleTypes.indexOf(type) === -1) {
      type = type.split(' ').map(token => capitalize(token)).join('');
      if (type === 'RemoteOauthClient') {
        type = 'OauthClient'
      } else if (type === 'PlainWebhook') {
        type = 'Webhook'
      }
      schema = {
        referenced: true,
        $ref: {
          namespace: 'Setup',
          name: type
        }
      };
    } else {
      schema = { type };
    }
  } else {
    schema = {}
  }

  if (many) {
    const referenced = schema.referenced;
    delete schema.referenced;
    schema = { type: 'array', items: schema };
    if (referenced) {
      schema.referenced = true;
    }
  }

  if (group) {
    schema.group = group;
  }

  if (description) {
    schema.description = description;
  }

  return schema;
}

const ConfigureApp = ({ docked, dataType, record, onSubjectPicked, height }) => {
  const [state, setState] = useSpreadState();
  const [_, setContainerState] = useContainerContext();

  const { formDataType, value } = state;

  useEffect(() => {
    setContainerState({ breadcrumbActionName: "Configure" });

    return () => {
      setContainerState({ breadcrumbActionName: null });
    };
  }, []);

  useEffect(() => {
    const subscription = dataType.get(record.id, {
      viewport: '{application_parameters configuration}',
      include_id: true
    }).subscribe(({ application_parameters, configuration }) => {
        application_parameters = application_parameters || [];
        const formDataType = DataType.from({
          name: 'Config',
          schema: {
            properties: {
              ...(dataType.name === 'Application' && ({
                authentication_method: {
                  type: 'string',
                  enum: ['User credentials', 'Application ID'],
                  group: 'Security',
                  default: 'User credentials'
                }
              }) || undefined),
              logo: {
                type: 'string',
                group: 'UI'
              },
              redirect_uris: {
                type: 'array',
                items: {
                  type: 'string'
                },
                group: 'OAuth'
              },
              ...application_parameters.reduce((config, p) => {
                config[p.name] = parameterSchema(p);
                return config;
              }, {})
            }
          }
        });
        configuration[FETCHED] = true;
        setState({
          formDataType,
          application_parameters,
          value: new FormRootValue(configuration)
        });
      }
    );

    return () => subscription.unsubscribe();
  }, [record.id, dataType]);


  const handleFormSubmit = (_, value) => API.post(
    underscore(dataType.namespace), underscore(dataType.name), record.id, 'digest', 'config', value.get()
  ).pipe(
    map(() => ({}))
  );

  if (formDataType) {
    return (
      <div className="relative">
        <FormEditor docked={docked}
                    dataType={formDataType}
                    height={height}
                    submitIcon={<ConfigIcon />}
                    onFormSubmit={handleFormSubmit}
                    onSubjectPicked={onSubjectPicked}
                    successControl={SuccessAppConfig}
                    value={value} />
      </div>
    );
  }

  return <Loading />;
};

export default ActionRegistry.register(ConfigureApp, {
  kind: ActionKind.member,
  icon: ConfigIcon,
  title: 'Configure',
  arity: 1,
  onlyFor: [
    { namespace: 'Setup', name: 'Application' },
    { namespace: 'Cenit', name: 'BuildInApp' }
  ]
});
