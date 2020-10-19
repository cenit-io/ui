import { map, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import zzip from "../util/zzip";
import { DataType, Property } from "../services/DataTypeService";
import FormContex from "../services/FormContext";
import PropertyControl from "./PropertyControl";
import { FormGroup } from "./FormGroup";
import ErrorMessages from "./ErrorMessages";
import { LinearProgress } from "@material-ui/core";
import React, { useEffect, useReducer } from "react";
import { FETCHED } from "../common/Symbols";
import spreadReducer from "../common/spreadReducer";
import { DataTypeSubject } from "../services/subjects";
import { tap } from "rxjs/internal/operators/tap";
import Group from "./Group";

function ObjectControl(props) {
    const [state, setState] = useReducer(spreadReducer, {});

    const { schemaResolver, properties, schema, config } = state;

    const {
        rootDataType, jsonPath, rootId, onChange, value, dataType,
        dataTypeId, property, width, disabled, onStack, readOnly
    } = props;

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
        if (schemaResolver && properties && rootId && !(value && value[FETCHED])) {
            const subscription = DataTypeSubject.for(dataTypeId).config().pipe(
                switchMap(config => {
                    const configViewport = rootId
                        ? config.actions?.edit?.viewport
                        : config.actions?.new?.viewport;

                    if (configViewport) {
                        return of(configViewport);
                    }

                    return getDataType().shallowViewPort();
                }),
                switchMap(viewport => {
                    console.log('Fetching for editing', rootId, jsonPath, viewport);
                    return rootDataType.get(rootId, {
                        viewport,
                        jsonPath,
                        with_references: true
                    });
                })
            ).subscribe(
                v => {
                    (v = v || {})[FETCHED] = true;
                    Object.getOwnPropertySymbols(value).forEach(symbol => v[symbol] = value[symbol]);
                    onChange(v);
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [schemaResolver, properties, rootId, value, onChange]);

    const getDataType = () => schemaResolver &&
        (schemaResolver.constructor === Property ? schemaResolver.dataType : schemaResolver);

    const handleChange = prop => v => {
        value[prop.jsonKey] = v;
        if (prop.type === 'refMany' || prop.type === 'array') {
            _update(prop.name, value);
        }
        onChange(value);
    };

    const handleDelete = prop => () => {
        if (rootId) {
            if (prop.type === 'refMany' || prop.type === 'array') {
                _update(prop.name, value);
            }
            value[prop.jsonKey] = null;
        } else {
            delete value[prop.jsonKey];
        }
        onChange(value);
    };

    const _update = (prop, value) => {
        const resetProps = value._update || [];
        const index = resetProps.indexOf(prop);
        if (index === -1) {
            resetProps.push(prop);
        }
        value._update = resetProps;
    };

    const isReady = () => properties && valueReady();

    const valueReady = () => !rootId || (value && value[FETCHED]);

    const errors = props.errors || {};
    const context = rootId ? FormContex.edit : FormContex.new;

    if (isReady()) {
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
                    <PropertyControl rootDataType={rootDataType}
                                     jsonPath={`${jsonPath}.${prop.name}`}
                                     property={prop}
                                     key={prop.name}
                                     value={value[prop.jsonKey]}
                                     errors={errors[prop.name]}
                                     width={width}
                                     onChange={handleChange(prop)}
                                     onDelete={handleDelete(prop)}
                                     disabled={disabled}
                                     readOnly={readOnly || prop.isReadOnly(context)}
                                     onStack={onStack}
                                     rootId={rootId}
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
        </FormGroup>;
    }

    return <LinearProgress className='full-width'/>;
}

export default ObjectControl;
