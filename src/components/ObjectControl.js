import { map, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import zzip from "../util/zzip";
import { DataType, Property } from "../services/DataTypeService";
import FormContex from "../services/FormContext";
import PropertyControl from "./PropertyControl";
import { FormGroup } from "./FormGroup";
import ErrorMessages from "./ErrorMessages";
import { LinearProgress } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { FETCHED } from "../common/Symbols";

function ObjectControl(props) {
    const [state, setState] = useState({});
    const { schemaResolver, properties, schema } = state;
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
                doSetState({ schemaResolver: resolver });
            } else {
                const subscription = DataType.getById(dataTypeId).subscribe(
                    dataType => doSetState({ schemaResolver: dataType })
                );

                return () => subscription.unsubscribe();
            }
        }
    }, [dataType, property]);

    useEffect(() => {
        if (schemaResolver) {
            const subscription = schemaResolver.getSchema().subscribe(
                schema => doSetState({ schema })
            );
            return () => subscription.unsubscribe();
        }
    }, [schemaResolver]);

    useEffect(() => {
        if (schema) {
            const subscription = getDataType().visibleProps().pipe(
                switchMap(visibleProps =>
                    zzip(...visibleProps.map(
                        prop => (prop && zzip(prop.isReferenced(), prop.isMany(), prop.getSchema()).pipe(
                                map(
                                    fullfill => {
                                        if (fullfill[0]) { // Referenced
                                            if (fullfill[1]) { // Many
                                                prop.type = 'refMany';
                                            } else { // One
                                                prop.type = 'refOne';
                                            }
                                        } else {
                                            const schema = fullfill[2];
                                            prop.type = schema['type'];
                                        }
                                        return prop;
                                    }
                                ))
                        ) || of(prop))
                    )
                )).subscribe(properties => doSetState({ properties }));
            return () => subscription.unsubscribe();
        }
    }, [schema]);

    useEffect(() => {
        if (schemaResolver && properties && !valueReady()) {
            const subscription = getDataType().shallowViewPort().pipe(
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
    }, [schemaResolver, properties]);

    const doSetState = values => setState({ ...state, ...values });

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
        onChange({ ...value });
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
        const controls = properties.map(
            prop => <PropertyControl rootDataType={rootDataType}
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
                                     rootId={rootId}/>
        );

        return <FormGroup error={Object.keys(errors).length > 0}>
            <ErrorMessages errors={errors.$}>
                {controls}
            </ErrorMessages>
        </FormGroup>;
    }

    return <LinearProgress className='full-width'/>;
}

export default ObjectControl;
