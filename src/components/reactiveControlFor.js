import React, { useEffect, useRef } from 'react';
import Random from "../util/Random";
import { Failed } from "../common/Symbols";
import { useSpreadState } from "../common/hooks";
import { useFormContext } from "./FormContext";

const reactiveControlFor = Control => function (props) {

  const { value, errors, onDelete, onChange, parser, validator, onError } = props;

  const [state, setState] = useSpreadState({
    key: Random.string(),
    controlledValue: value.get()
  });

  const refValue = useRef(value.cache);

  const { initialFormValue } = useFormContext();

  const { key, autoFocus, controlledValue } = state;

  useEffect(() => {
    setState({ key: Random.string() });
    if (value) {
      const subscription = value.changed().subscribe(
        v => {
          if (v !== refValue.current) {
            refValue.current = v;
            setState({
              key: Random.string(),
              controlledValue: v
            })
          }
        }
      );
      value.changed().next(value.get());
      return () => subscription.unsubscribe();
    }
  }, [value]);

  const handleChange = v => {
    let parsedValue;
    if (parser) {
      parsedValue = parser(v);
    } else {
      parsedValue = v;
    }
    if (parsedValue !== Failed) {
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
      refValue.current = parsedValue;
      setState({ controlledValue: parsedValue });
      value.set(parsedValue);
      setState(newState);
      onChange && onChange(parsedValue);
    }
  };

  const handleClear = () => {
    const initialValue = value.valueFrom(initialFormValue);
    let controlledValue;
    if (initialValue !== undefined && initialValue !== null) {
      refValue.current = null;
      setState({ controlledValue: null });
      value.set(null);
    } else {
      refValue.current = undefined;
      setState({ controlledValue: undefined });
      value.delete();
    }
    onDelete();
  };

  const error = Boolean(errors && errors.length);

  return (
    <Control {...props}
             value={controlledValue}
             dynamicKey={key}
             error={error}
             onChange={handleChange}
             autoFocus={autoFocus}
             onClear={handleClear} />
  );
};

export default reactiveControlFor;
