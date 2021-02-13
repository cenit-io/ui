import React, { useCallback, useEffect, useRef } from 'react';
import { useSpreadState } from "../common/hooks";
import { debounce, switchMap, tap } from "rxjs/operators";
import { interval, of } from "rxjs";
import FrezzerLoader from "./FrezzerLoader";
import zzip from "../util/zzip";
import { DefaultPropertiesForm } from "./ObjectControl";

const FormProps = [
    'namespace', 'name', 'description', 'event', 'translator',
    'custom_data_type', 'data_type_scope', 'scope_filter', 'scope_evaluator', 'lot_size',
    'webhook', 'authorization', 'connection_role', 'before_submit',
    'response_translator', 'response_data_type', 'discard_events',
    'notify_request', 'notify_response',
    'active', 'auto_retry', 'after_process_callbacks'
];

const DefaultScopeOptions = ['All', 'Evaluator'];

export default function FlowFormControl({
                                            errors, value, propertyControlProps, properties,
                                            controlConfig, dynamicConfigState
                                        }) {

    const [state, setState] = useSpreadState({
        formValue: {},
        webhook: {
            editDisabled: true
        }
    });

    const [hidden, setHidden] = useSpreadState(
        FormProps.reduce((state, prop, index) => {
            state[prop] = 4 < index && index < 19;
            return state;
        }, {})
    );

    const cache = useRef({});

    const { formValue, loading } = state;

    const { event, translator, custom_data_type, data_type_scope, response_translator } = formValue;

    const valueOf = useCallback(name => {
        const formValue = value.get();
        if (formValue[name]) {
            const prop = properties.find(p => p.name === name);
            if (prop) {
                return prop.isSimple().pipe(
                    switchMap(simple => {
                        if (simple) {
                            return of(formValue[name]);
                        }
                        const id = formValue[name].id;
                        if (cache.current[name]?.id !== id) {
                            return prop.dataType.get(id).pipe(
                                tap(value => cache.current[name] = {
                                    id, value
                                })
                            );
                        }
                        return of(cache.current[name].value);
                    })
                )
            }
        }
        return of(null);
    }, [properties, value]);

    useEffect(() => {
        const subscription = value.changed().pipe(
            debounce(() => interval(100))
        ).subscribe(
            formValue => setState({ formValue })
        );

        return () => subscription.unsubscribe();
    }, [value]);

    useEffect(() => {
        if (translator) {
            setState({ loading: true });
            const subscription = zzip(
                valueOf('event'),
                valueOf('translator'),
            ).subscribe(
                ([event, { type, source_data_type, target_data_type }]) => {
                    const customDataType = value.get().custom_data_type;
                    let done;
                    let translatorDataTye;
                    if (
                        ((type === 'Export' || type === 'Conversion') && (translatorDataTye = source_data_type)) ||
                        ((type === 'Import' || type === 'Update') && (translatorDataTye = target_data_type))
                    ) {
                        if (value.cache.custom_data_type) {
                            value.propertyValue('custom_data_type').delete();
                            done = true;
                            value.propertyValue('data_type_scope').delete();
                            setHidden({ custom_data_type: true, data_type_scope: true });
                        }
                    } else {
                        setHidden({ custom_data_type: false });
                        if (!customDataType) {
                            value.propertyValue('custom_data_type').set(event?.data_type, true);
                            done = true;
                        }
                    }
                    if (!done) {
                        const dataTypeScope = value.propertyValue('data_type_scope');
                        if (type === 'Import') {
                            setHidden({ data_type_scope: true });
                            dataTypeScope.delete();
                        } else {
                            setHidden({ data_type_scope: false });
                            let options = DefaultScopeOptions;
                            if (event?.data_type && (
                                translatorDataTye?.id === event.data_type.id ||
                                customDataType?.id === event.data_type.id
                            )) {
                                options = ['Event source', ...options];
                            }
                            if (translatorDataTye || customDataType) {
                                options = [...options, 'Filter'];
                            }
                            setState({
                                data_type_scope: {
                                    options,
                                    title: type === 'Update' ? 'Target scope' : 'Source scope'
                                }
                            });
                            if (options.indexOf(dataTypeScope.get()) === -1) {
                                dataTypeScope.deleteAndNotify();
                            }
                        }
                    }
                    setState({
                        custom_data_type: {
                            title: (type === 'Update' || type === 'Import') ? 'Target data type' : 'Source data type'
                        },
                        loading: false
                    });
                }
            );

            return () => subscription.unsubscribe();
        } else {
            value.propertyValue('custom_data_type').delete();
            value.propertyValue('data_type_scope').delete();
            setHidden({ custom_data_type: true, data_type_scope: true });
        }
    }, [event, translator, custom_data_type, value, valueOf]);

    useEffect(() => {
        const subscription = valueOf('translator').subscribe(translator => {
            const hidden = {
                scope_filter: data_type_scope !== 'Filter',
                scope_evaluator: data_type_scope !== 'Evaluator',
                lot_size: (
                    !translator ||
                    translator.type !== 'Export' ||
                    !data_type_scope ||
                    data_type_scope === 'Event source'
                )
            };
            Object.keys(hidden).forEach(
                key => hidden[key] && value.propertyValue(key).delete()
            );
            setHidden(hidden);
        });

        return () => subscription.unsubscribe();
    }, [value, valueOf, data_type_scope]);

    useEffect(() => {
        const subscription = valueOf('translator').subscribe(translator => {
            const hidingGateway = !translator || (translator.type !== 'Export' && translator.type !== 'Import');
            const { data_type_scope } = value.get();
            const hidden = {
                lot_size: (
                    !translator ||
                    translator.type !== 'Export' ||
                    !data_type_scope ||
                    data_type_scope === 'Event source'
                ),
                webhook: hidingGateway,
                authorization: hidingGateway,
                connection_role: hidingGateway,
                before_submit: !translator || translator.type !== 'Import',
                response_translator: !translator || translator.type !== 'Export',
                notify_request: hidingGateway,
                notify_response: hidingGateway
            };
            Object.keys(hidden).forEach(
                key => hidden[key] && value.propertyValue(key).delete()
            );
            setHidden(hidden);
        });

        return () => subscription.unsubscribe();
    }, [value, valueOf, translator]);

    useEffect(() => {
        const subscription = valueOf('response_translator').subscribe(translator => {
            const hidden = {
                response_data_type: (
                    !translator ||
                    translator.type !== 'Import' ||
                    translator.target_data_type
                ),
                discard_events: !translator || translator.type !== 'Import'
            };
            if (hidden.response_data_type) {
                value.propertyValue('response_data_type').delete()
            }
            setHidden(hidden);
        });

        return () => subscription.unsubscribe();
    }, [value, valueOf, response_translator]);

    const propertiesHash = properties.reduce((hash, p) => (hash[p.name] = p) && hash, {});

    const visibleProperties = FormProps.map(name => (
        !hidden[name] && propertiesHash[name]
    )).filter(c => c);

    const customPropertyControlProps = name => ({
        ...propertyControlProps(name),
        ...state[name]
    });

    return (
        <>
            <DefaultPropertiesForm errors={errors}
                                   propertyControlProps={customPropertyControlProps}
                                   controlConfig={controlConfig}
                                   dynamicConfigState={dynamicConfigState}
                                   properties={visibleProperties}/>
            {loading && <FrezzerLoader/>}
        </>
    );
}
