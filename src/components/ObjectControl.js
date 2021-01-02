import { map, switchMap } from "rxjs/operators";
import { isObservable, of } from "rxjs";
import { DataType, Property } from "../services/DataTypeService";
import FormContex from "../services/FormContext";
import PropertyControl from "./PropertyControl";
import { FormGroup } from "./FormGroup";
import ErrorMessages from "./ErrorMessages";
import { LinearProgress } from "@material-ui/core";
import React, { useCallback, useEffect, useReducer } from "react";
import { FETCHED, NEW } from "../common/Symbols";
import spreadReducer from "../common/spreadReducer";
import { DataTypeSubject } from "../services/subjects";
import { tap } from "rxjs/internal/operators/tap";
import Collapsible from "./Collapsible";
import { useFormContext } from "./FormContext";
import FrezzerLoader from "./FrezzerLoader";
import { eq } from "../services/BLoC";
import zzip from "../util/zzip";

function editFields(config) {
    const editConfig = config.actions?.edit;
    const newConfig = config.actions?.new;
    if (editConfig?.fields) {
        return editConfig.fields;
    }
    let fields = newConfig?.fields;
    if (fields) {
        if (fields.indexOf('id') === -1) {
            fields = ['id', ...fields];
        }
        return fields;
    }
}

function editViewport(config, dataType, ...plus) {
    const editConfig = config.actions?.edit;
    if (editConfig?.viewport) {
        if (plus.length) {
            let viewport = editConfig.viewport.trim();
            if (viewport.endsWith('}')) {
                viewport = viewport.substring(0, viewport.length - 1);
            }
            return `${viewport} ${plus.join(' ')}}`;
        }
        return editConfig.viewport;
    }
    const fields = editFields(config);
    if (fields) {
        return dataType.shallowViewPort(...fields, ...plus);
    }
}

export function formConfigProperties(dataType, editMode = false) {
    const subject = DataTypeSubject.for(dataType?.id);
    return (subject?.config() || of({})).pipe(
        switchMap(config => {
            let propsObservable;
            const configFields = editMode
                ? editFields(config)
                : config.actions?.new?.fields;
            if (configFields) {
                propsObservable = dataType.properties().pipe(
                    map(
                        properties => configFields.map(
                            field => properties[field]
                        )
                    )
                );
            } else {
                propsObservable = dataType.visibleProps();
            }
            return zzip(of(config), propsObservable);
        })
    )
}

function DefaultPropertiesForm({ controlConfig, dynamicConfigState, properties, propertyControlProps, errors }) {
    const controls = [];
    const configFields = controlConfig?.fields || {};
    const groups = [];
    const controlsGroups = { default: controls };
    const groupsProps = { default: [] };
    properties.forEach(
        prop => {
            const fieldConfig = {
                ...configFields[prop.name],
                ...(dynamicConfigState && dynamicConfigState[prop.name])
            };
            if (!fieldConfig.hidden) {
                const group = fieldConfig.group || 'default';
                let controlsGroup = controlsGroups[group];
                let groupProps = groupsProps[group];
                if (!controlsGroup) {
                    controlsGroups[group] = controlsGroup = [];
                    groupsProps[group] = groupProps = [];
                    groups.push(group);
                }
                groupProps.push(prop.name);
                controlsGroup.push(
                    <PropertyControl {...propertyControlProps(prop)}/>
                );
            }
        }
    );

    groups.forEach(group => controls.push(
        <Collapsible key={`group_${group}`}
                     title={group}
                     children={controlsGroups[group]}
                     error={!!groupsProps[group].find(p => errors.hasOwnProperty(p))}/>
    ));

    return controls;
}

function ObjectControl(props) {
    const [state, setState] = useReducer(spreadReducer, {});

    const { initialFormValue } = useFormContext();

    const {
        properties, controlConfig, ready,
        orchestrator, orchestratorState, dynamicConfig, dynamicConfigState
    } = state;

    const {
        onChange, value, dataType, fetchPath, onFetched, config,
        property, width, disabled, onStack, readOnly
    } = props;

    const { rootId, rootDataType } = useFormContext();

    const getDataType = useCallback(() => dataType || property?.dataType, [dataType, property]);

    useEffect(() => {
        const editMode = rootId;
        const subscription = formConfigProperties(
            getDataType(),
            rootId
        ).subscribe(([sConfig, properties]) => {
            setState({
                properties,
                controlConfig: { ...sConfig, ...config },
                orchestrator: ( // TODO can be new with rootId in EmbedsManyControl
                    editMode
                        ? sConfig?.actions?.edit?.orchestrator
                        : sConfig?.actions?.new?.orchestrator
                ) || sConfig?.orchestrator,
                dynamicConfig: ( // TODO can be new with rootId in EmbedsManyControl
                    editMode
                        ? sConfig?.actions?.edit?.dynamicConfig
                        : sConfig?.actions?.new?.dynamicConfig
                ) || sConfig?.dynamicConfig
            });
        });
        return () => subscription.unsubscribe();
    }, [dataType, property, config]);

    useEffect(() => {
        if (rootId) {
            const v = value.get();
            if (!(v && v[FETCHED])) {
                const subject = DataTypeSubject.for(getDataType().id);
                const subscription = (subject?.config() || of({})).pipe(
                    switchMap(config => {
                        const configViewport = v[NEW]
                            ? config.actions?.new?.viewport
                            : editViewport(config, getDataType(), 'id');

                        if (configViewport) {
                            if (typeof configViewport === 'string') {
                                return of(configViewport);
                            }
                            return configViewport;
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
                        setState({ ready: true });
                    }
                );
                return () => subscription.unsubscribe();
            }
        } else if (value.get() && !value.cache[FETCHED]) {
            value.set({ ...value.cache, [FETCHED]: true });
            setState({ ready: true });
        }
    }, [getDataType, rootId, value, initialFormValue]);

    useEffect(() => {
        if (orchestrator) {
            const subscription = value.changed().subscribe(
                v => {
                    let newState = orchestrator(v, orchestratorState || {}, value);
                    if (newState) {
                        if (!isObservable(newState)) {
                            newState = of(newState);
                        }
                        newState.subscribe(s => { // TODO unsubscribe
                            if (s) {
                                setState({ orchestratorState: s });
                            }
                        });
                    }
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [orchestrator, orchestratorState, value]);

    useEffect(() => {
        if (dynamicConfig) {
            const subscription = value.changed().subscribe(
                v => {
                    let newState = dynamicConfig(v, dynamicConfigState || {}, value);
                    if (newState) {
                        if (!isObservable(newState)) {
                            newState = of(newState);
                        }
                        newState.subscribe(s => { // TODO unsubscribe
                            if (s) {
                                setState({ dynamicConfigState: s });
                            }
                        });
                    }
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [dynamicConfig, dynamicConfigState, value]);

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

        const configFields = controlConfig?.fields || {};

        const propertyControlProps = prop => {
            const fieldConfig = {
                ...configFields[prop.name],
                ...(dynamicConfigState && dynamicConfigState[prop.name])
            };

            return {
                key: prop.name + (fieldConfig.key || ''),
                property: prop,
                value: value.propertyValue(prop.jsonKey),
                errors: errors[prop.name],
                width: width,
                onChange: handleChange(prop),
                onDelete: handleDelete(prop),
                disabled: fetching || disabled,
                readOnly: readOnly || prop.isReadOnly(context),
                onStack: onStack,
                config: fieldConfig,
                ready: ready,
                ...fieldConfig.controlProps,
                ...(orchestratorState && orchestratorState[prop.name])
            };
        };

        const FormControl = controlConfig.formControl || DefaultPropertiesForm;

        return <FormGroup error={Object.keys(errors).length > 0}>
            <ErrorMessages errors={errors.$}>
                <FormControl properties={properties}
                             dynamicConfigState={dynamicConfigState}
                             controlConfig={controlConfig}
                             propertyControlProps={propertyControlProps}
                             errors={errors}/>
            </ErrorMessages>
            {fetching && <FrezzerLoader/>}
        </FormGroup>;
    }

    return <LinearProgress className='full-width'/>;
}

export default ObjectControl;
