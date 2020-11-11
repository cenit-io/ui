import { map, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { DataType, Property } from "../services/DataTypeService";
import FormContex from "../services/FormContext";
import PropertyControl from "./PropertyControl";
import { FormGroup } from "./FormGroup";
import ErrorMessages from "./ErrorMessages";
import { LinearProgress } from "@material-ui/core";
import React, { useEffect, useReducer } from "react";
import { FETCHED, NEW } from "../common/Symbols";
import spreadReducer from "../common/spreadReducer";
import { DataTypeSubject } from "../services/subjects";
import { tap } from "rxjs/internal/operators/tap";
import Group from "./Group";
import { useFormContext } from "./FormContext";
import FrezzerLoader from "./FrezzerLoader";

function ObjectControl(props) {
    const [state, setState] = useReducer(spreadReducer, {});

    const { initialFormValue } = useFormContext();

    const { schemaResolver, properties, schema, config } = state;

    const {
        onChange, value, dataType, fetchPath, onFetched,
        dataTypeId, property, width, disabled, onStack, readOnly
    } = props;

    const { rootId, rootDataType } = useFormContext();

    useEffect(() => {
        const resolver = dataType || property;
        if (
            !schemaResolver || (resolver && schemaResolver !== resolver) || schemaResolver.id !== dataTypeId
        ) {
            if (resolver) {
                setState({ schemaResolver: resolver });
            } else {
                const subscription = DataType.getById(dataTypeId).subscribe(
                    dataType => setState({ schemaResolver: dataType })
                );

                return () => subscription.unsubscribe();
            }
        }
    }, [dataType, property]);

    useEffect(() => {
        if (schemaResolver) {
            const subscription = schemaResolver.getSchema().subscribe(
                schema => setState({ schema })
            );
            return () => subscription.unsubscribe();
        }
    }, [schemaResolver]);

    useEffect(() => {
        if (schema) {
            const subscription = DataTypeSubject.for(dataTypeId).config().pipe(
                tap(config => setState({ config })),
                switchMap(config => {
                    const configFields = rootId
                        ? config.actions?.edit?.fields
                        : config.actions?.new?.fields;
                    if (configFields) {
                        return getDataType().properties().pipe(
                            map(
                                properties => configFields.map(
                                    field => properties[field]
                                )
                            )
                        );
                    }

                    return getDataType().visibleProps();
                })
            ).subscribe(properties => setState({ properties }));
            return () => subscription.unsubscribe();
        }
    }, [schema]);

    useEffect(() => {
        if (schemaResolver && properties && rootId) {
            const v = value.get();
            if (!(v && v[FETCHED])) {
                const subscription = DataTypeSubject.for(dataTypeId).config().pipe(
                    switchMap(config => {
                        const configViewport = v[NEW]
                            ? config.actions?.new?.viewport
                            : config.actions?.edit?.viewport;

                        if (configViewport) {
                            return of(configViewport);
                        }

                        return getDataType().shallowViewPort();
                    }),
                    switchMap(viewport => {
                        const jsonPath = fetchPath || value.jsonPath();
                        console.log('Fetching for editing', rootId, jsonPath, viewport);
                        return rootDataType.get(rootId, {
                            viewport,
                            jsonPath,
                            with_references: true
                        });
                    })
                ).subscribe(
                    fetchedValue => {
                        (fetchedValue = fetchedValue || {})[FETCHED] = true;
                        Object.getOwnPropertySymbols(v).forEach(symbol => fetchedValue[symbol] = v[symbol]);
                        value.set(fetchedValue, true);
                        onFetched && onFetched(fetchedValue);
                        value.setOn(initialFormValue, fetchedValue);
                        setState({}); // for refresh
                    }
                );
                return () => subscription.unsubscribe();
            }
        }
    }, [schemaResolver, properties, rootId, value, onChange, onFetched, initialFormValue]);

    const getDataType = () => schemaResolver &&
        (schemaResolver.constructor === Property ? schemaResolver.dataType : schemaResolver);

    const handleChange = prop => () => {
        _update(prop);
        onChange && onChange(value.get());
    };

    const handleDelete = prop => () => {
        _update(prop.name);
        onChange && onChange(value.get());
    };

    const _update = prop => {
        if (rootId && (prop.type === 'refMany' || prop.type === 'embedsMany' || prop.type === 'array')) {
            value.set(({ _update, ...coreValue }) => {
                _update = _update || [];
                const index = _update.indexOf(prop.name);
                if (index === -1) {
                    _update.push(prop.name);
                }
                return { ...coreValue, _update };
            })
        }
    };

    const errors = props.errors || {};
    const context = rootId ? FormContex.edit : FormContex.new;

    if (properties) {
        const fetching = value.get() && !value.cache[FETCHED];
        const controls = [];
        const configFields = config.fields || {};
        const groups = [];
        const controlsGroups = { default: controls };
        const groupsProps = { default: [] };
        properties.forEach(
            prop => {
                const fieldConfig = configFields[prop.name];
                const group = fieldConfig?.group || 'default';
                let controlsGroup = controlsGroups[group];
                let groupProps = groupsProps[group];
                if (!controlsGroup) {
                    controlsGroups[group] = controlsGroup = [];
                    groupsProps[group] = groupProps = [];
                    groups.push(group);
                }
                groupProps.push(prop.name);
                controlsGroup.push(
                    <PropertyControl key={prop.name}
                                     property={prop}
                                     value={value.propertyValue(prop.jsonKey)}
                                     errors={errors[prop.name]}
                                     width={width}
                                     onChange={handleChange(prop)}
                                     onDelete={handleDelete(prop)}
                                     disabled={fetching || disabled}
                                     readOnly={readOnly || prop.isReadOnly(context)}
                                     onStack={onStack}
                                     config={fieldConfig}/>
                );
            }
        );

        groups.forEach(group => controls.push(
            <Group key={`group_${group}`}
                   name={group}
                   children={controlsGroups[group]}
                   error={!!groupsProps[group].find(p => errors.hasOwnProperty(p))}/>
        ));

        return <FormGroup error={Object.keys(errors).length > 0}>
            <ErrorMessages errors={errors.$}>
                {controls}
            </ErrorMessages>
            {fetching && <FrezzerLoader/>}
        </FormGroup>;
    }

    return <LinearProgress className='full-width'/>;
}

export default ObjectControl;
