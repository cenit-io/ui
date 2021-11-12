import React, { useEffect } from 'react';
import ConfigIcon from '@material-ui/icons/Settings';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import FormEditor from "../components/FormEditor";
import { useSpreadState } from "../common/hooks";
import { DataType, JSON_TYPE } from "../services/DataTypeService";
import Loading from "../components/Loading";
import API from "../services/ApiService";
import SuccessAlert from "./SuccessAlert";
import { Config, FETCHED } from "../common/Symbols";
import {  switchMap } from "rxjs/operators";
import { FormRootValue } from "../services/FormValue";
import { underscore } from "../common/strutls";
import Random from "../util/Random";
import { of } from "rxjs";
import { useContainerContext } from './ContainerContext';

export function SuccessConfig() {

    return (
        <SuccessAlert mainIcon={ConfigIcon}/>
    );
}

const DataTypeConfig = ({ docked, record, onSubjectPicked, height }) => {
    const [state, setState] = useSpreadState({
        retry: Random.string()
    });

    const { value, formDataType } = state;

    const containerContext = useContainerContext();
    const [,setContainerState] = containerContext;
    
    useEffect(() => {
        setContainerState({ breadcrumbActionName: "Configure" });

        return () => {
          setContainerState({ breadcrumbActionName: null });
        };
      }, []);

    useEffect(() => {
        const schema = {
            type: 'object',
            properties: {
                slug: {
                    type: 'string',
                    default: underscore(record.name)
                }
            }
        };
        if (record._type === JSON_TYPE) {
            schema.properties.trace_on_default = {
                type: 'boolean'
            }
        }
        setState({
            formDataType: DataType.from({
                name: 'Config',
                schema
            })
        });

        const subscription = API.get(
            'setup', 'data_type', record.id, 'digest', 'config'
        ).subscribe(config => {
            config[FETCHED] = true;
            setState({ value: new FormRootValue(config) });
        }); // TODO On error?

        return () => subscription.unsubscribe();
    }, [record]);

    const handleFormSubmit = (_, value) => {
        let { trace_on_default, slug } = value.get();
        slug = (slug || '').trim();
        return of(true).pipe(
            switchMap(() => {
                let error;
                if (!slug) {
                    error = { slug: ["can't be blank"] };
                } else if (underscore(slug) !== slug) {
                    error = { slug: ["is not valid"] };
                }
                if (error) {
                    throw ({ response: { data: error } });
                }

                return API.post('setup', 'data_type', record.id, 'digest', 'config', {
                    slug,
                    trace_on_default
                });
            })
        );
    };

    if (value && formDataType) {
        return (
            <FormEditor key={record.id}
                        docked={docked}
                        dataType={formDataType}
                        height={height}
                        submitIcon={<ConfigIcon/>}
                        onFormSubmit={handleFormSubmit}
                        onSubjectPicked={onSubjectPicked}
                        successControl={SuccessConfig}
                        value={value}/>
        );
    }

    return <Loading/>;
};

export default ActionRegistry.register(DataTypeConfig, {
    kind: ActionKind.member,
    icon: ConfigIcon,
    title: 'Configure',
    arity: 1,
    onlyFor: [
        { namespace: 'Setup', name: 'JsonDataType' },
        { namespace: 'Setup', name: 'FileDataType' }
    ]
});
