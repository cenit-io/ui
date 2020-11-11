import React, { useReducer, useEffect } from 'react';
import Random from "../util/Random";
import { Failed } from "../common/Symbols";
import spreadReducer from "../common/spreadReducer";
import { useSpreadState } from "../common/hooks";
import { useFormContext } from "./FormContext";

const reactiveControlFor = Control => function (props) {

    const { value, errors, onDelete, onChange, parser, validator, onError } = props;

    const [state, setState] = useSpreadState({
        key: Random.string()
    });

    const { initialFormValue } = useFormContext();

    const { key, autoFocus } = state;

    useEffect(() => {
        setState({ key: Random.string() });
        const subscription = value.changed().subscribe(
            v => setState({ key: Random.string() })
        );
        return () => subscription.unsubscribe();
    }, [value]);

    const handleChange = v => {
        let parsedValue;
        if (parser) {
            parsedValue = parser(v);
        } else {
            parsedValue = v;
        }
        if (parsedValue === Failed) {
            setState({
                key: Random.string(),
                autoFocus: true
            });
        } else {
            const newState = {};
            if (validator) {
                let errors = validator(parsedValue);
                if (errors) {
                    if (errors.constructor !== Array) {
                        errors = [errors];
                    }
                    onError(errors);
                    newState.hasErrors = true;
                } else if (newState.hasErrors) {
                    delete newState.hasErrors;
                    onError(null);
                }
            }
            value.set(parsedValue);
            setState(newState);
            onChange && onChange(parsedValue);
        }
    };

    const handleClear = () => {
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue !== undefined && initialValue !== null) {
            value.set(null);
        } else {
            value.delete();
        }
        onDelete();
        setState({
            key: Random.string(),
            autoFocus: false
        })
    };

    const handleBlur = () => setState({
        key: Random.string(),
        autoFocus: false
    });

    const error = Boolean(errors && errors.length);

    return (
        <Control {...props}
                 value={value.get()}
                 dynamicKey={key}
                 error={error}
                 onChange={handleChange}
                 onBlur={handleBlur}
                 autoFocus={autoFocus}
                 onClear={handleClear}
                 onFocus={() => setState({
                     autoFocus: true
                 })}/>
    );
};

export default reactiveControlFor;
