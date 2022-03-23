import { map, switchMap } from "rxjs/operators";
import { isObservable, of } from "rxjs";
import FormContex from "../services/FormContext";
import PropertyControl from "./PropertyControl";
import { FormGroup } from "./FormGroup";
import ErrorMessages from "./ErrorMessages";
import { LinearProgress } from "@material-ui/core";
import React, { useCallback, useEffect, useRef } from "react";
import { FETCHED, NEW } from "../common/Symbols";
import { DataTypeSubject } from "../services/subjects";
import Collapsible from "./Collapsible";
import { useFormContext } from "./FormContext";
import FrezzerLoader from "./FrezzerLoader";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import { deepMergeObjectsOnly } from "../common/merge";
import { useTenantContext } from "../layout/TenantContext";
import Edit from "../actions/Edit";
import New from "../actions/New";

function actionFields(config, actionKey, user = null) {
    const actionConfig = config.actions && config.actions[actionKey || Edit.key];
    const newConfig = config.actions && config.actions[New.key];
    if (actionConfig?.fields) {
        if (typeof actionConfig.fields === 'function') {
            return actionConfig.fields(user);
        }
        return actionConfig.fields;
    }
    let fields = newConfig?.fields;
    if (fields) {
        if (typeof fields === 'function') {
            fields = fields(user);
        }
        if (fields.indexOf('id') === -1) {
            fields = ['id', ...fields];
        }
        return fields;
    }
}

function actionViewportFields(config, actionKey, user = null) {
    return (
        config.actions && config.actions[actionKey || Edit.key]?.viewportFields
    ) || actionFields(config, actionKey, user);
}

function actionViewport(config, actionKey, dataType, embedded, user, ...plus) {
    const actionConfig = config.actions && config.actions[actionKey || Edit.key];
    const configViewport = (embedded && actionConfig?.embeddedViewport) || actionConfig?.viewport;
    if (configViewport) {
        if (plus.length) {
            let viewport = configViewport.trim();
            if (viewport.endsWith('}')) {
                viewport = viewport.substring(0, viewport.length - 1);
            }
            return `${viewport} ${plus.join(' ')}}`;
        }
        return configViewport;
    }
    const fields = actionViewportFields(config, actionKey, user);
    if (fields) {
        return dataType.shallowViewPort(...fields, ...plus);
    }
}

export function formConfigProperties(dataType, actionKey = New.key, user = null) {
    return (dataType?.config() || of({})).pipe(
        switchMap(config => {
            let propsObservable;
            const configFields = actionFields(config, actionKey, user);
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

export function DefaultPropertiesForm({ controlConfig, dynamicConfigState, properties, propertyControlProps, errors }) {
    const controls = [];
    const configFields = controlConfig?.fields || {};
    const groups = [];
    const controlsGroups = { default: controls };
    const groupsProps = { default: [] };
    properties.forEach(
        prop => {
            if (prop) {
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
                        <PropertyControl {...propertyControlProps(prop.name)}/>
                    );
                }
            }
        }
    );

    const groupsConfig = controlConfig?.groups || {};

    groups.forEach(group => controls.push(
        <Collapsible key={`group_${group}`}
                     title={groupsConfig[group]?.title || group}
                     variant={groupsConfig[group]?.variant || 'h6'}
                     children={controlsGroups[group]}
                     error={!!groupsProps[group].find(p => errors.hasOwnProperty(p))}
                     defaultCollapsed={!groupsConfig[group]?.activeByDefault}/>
    ));

    return controls;
}

function ObjectControl(props) {

    const [tenantState] = useTenantContext();

    const { user } = tenantState;

    const [state, setState] = useSpreadState();

    const { initialFormValue } = useFormContext();

    const orchestratorState = useRef({});

    const dynamicConfigState = useRef({});

    const {
        properties, controlConfig, ready,
        orchestrator, dynamicConfig,
    } = state;

    const {
        onChange, value, dataType, fetchPath, onFetched, config, formActionKey,
        property, width, disabled, onStack, readOnly, errors, fetched
    } = props;

    const { rootId, rootDataType } = useFormContext();

    const getDataType = useCallback(() => dataType || property?.dataType, [dataType, property]);

    useEffect(() => {
        const editMode = rootId;
        const subscription = formConfigProperties(
            getDataType(),
            formActionKey || (rootId ? Edit.key : New.key),
            user
        ).subscribe(([sConfig, properties]) => {
            setState({
                properties,
                controlConfig: deepMergeObjectsOnly(sConfig, config || {}),
                orchestrator: config?.orchestrator || (
                    // TODO can be new with rootId in EmbedsManyControl
                    editMode
                        ? sConfig?.actions?.edit?.orchestrator
                        : sConfig?.actions?.new?.orchestrator
                ) || sConfig?.orchestrator,
                dynamicConfig: config?.dynamicConfig || (
                    // TODO can be new with rootId in EmbedsManyControl
                    editMode
                        ? sConfig?.actions?.edit?.dynamicConfig
                        : sConfig?.actions?.new?.dynamicConfig
                ) || sConfig?.dynamicConfig
            });
        });
        return () => subscription.unsubscribe();
    }, [dataType, property, config, user, formActionKey]);

    useEffect(() => {
        if (rootId) {
            const v = value.get();
            if (!fetched && !(v && v[FETCHED])) {
                const subject = DataTypeSubject.for(getDataType().id);
                const subscription = (subject?.config() || of({})).pipe(
                    switchMap(config => {
                        const configViewport = v[NEW]
                            ? config.actions?.new?.viewport
                            : actionViewport(
                                config,
                                formActionKey,
                                getDataType(),
                                value.jsonPath() !== '$',
                                user,
                                'id'
                            );

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
                            with_references: true,
                            include_id: true
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
    }, [getDataType, rootId, value, initialFormValue, fetched, user, formActionKey]);

    useEffect(() => {
        if (orchestrator) {
            const subscription = value.changed().subscribe(
                v => {
                    let newState = orchestrator(v, orchestratorState.current, value, { readOnly, user });
                    if (newState) {
                        if (isObservable(newState)) {
                            newState.subscribe(s => { // TODO unsubscribe
                                if (s) {
                                    orchestratorState.current = s || {};
                                    setState({});
                                }
                            });
                        } else {
                            orchestratorState.current = newState || {};
                            setState({});
                        }
                    }
                }
            );
            value.changed().next(value.get());
            return () => subscription.unsubscribe();
        }
    }, [orchestrator, value, readOnly, user]);

    useEffect(() => {
        if (dynamicConfig) {
            const subscription = value.changed().subscribe(
                v => {
                    let newState = dynamicConfig(v, dynamicConfigState.current || {}, value, {
                        readOnly,
                        errors
                    }, user);
                    if (newState) {
                        if (!isObservable(newState)) {
                            newState = of(newState);
                        }
                        newState.subscribe(s => { // TODO unsubscribe
                            if (s) {
                                dynamicConfigState.current = s || {};
                                setState({});
                            }
                        });
                    }
                }
            );
            value.changed().next(value.get());
            return () => subscription.unsubscribe();
        }
    }, [dynamicConfig, value, readOnly, errors, user]);

    const handleChange = (prop, handler) => () => {
        if (!handler || handler() !== 'abort') {
            _update(prop);
            onChange && onChange(value.get());
        }
    };

    const handleDelete = (prop, handler) => () => {
        if (!handler || handler() !== 'abort') {
            _update(prop.name);
            onChange && onChange(value.get());
        }
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

    const formErrors = errors || {};
    const context = rootId ? FormContex.edit : FormContex.new;

    if (properties) {
        const fetching = !fetched && (value.get() && !value.cache[FETCHED]);

        const configFields = controlConfig?.fields || {};

        const propertyControlProps = (name, handlers) => {

            const prop = properties.find(p => p.name === name);

            if (prop) {
                const fieldConfig = {
                    ...configFields[name],
                    ...(dynamicConfigState.current[name])
                };

                return {
                    key: name + (fieldConfig.key || ''),
                    property: prop,
                    value: value.propertyValue(prop.jsonKey),
                    errors: formErrors[name],
                    width: width,
                    onChange: handleChange(prop, handlers?.onChange),
                    onDelete: handleDelete(prop, handlers?.onDelete),
                    disabled: fetching || disabled,
                    readOnly: readOnly || prop.isReadOnly(context),
                    onStack: onStack,
                    config: fieldConfig,
                    ready: ready,
                    ...fieldConfig.controlProps,
                    ...(orchestratorState.current && orchestratorState.current[name])
                };
            }
        };

        const FormControl = controlConfig.formControl || DefaultPropertiesForm;

        return <FormGroup error={Object.keys(formErrors).length > 0}>
            <ErrorMessages errors={formErrors.$}>
                <FormControl properties={properties}
                             dynamicConfigState={dynamicConfigState.current}
                             controlConfig={controlConfig}
                             propertyControlProps={propertyControlProps}
                             errors={formErrors}
                             value={value}
                             readOnly={readOnly}
                             disabled={disabled}
                             dataType={dataType}/>
            </ErrorMessages>
            {fetching && <FrezzerLoader/>}
        </FormGroup>;
    }

    return <LinearProgress className='full-width'/>;
}

export default ObjectControl;
