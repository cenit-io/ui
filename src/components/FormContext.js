import React, { useContext, useState, useEffect, useCallback } from 'react';

const FormContext = React.createContext({});

export default FormContext;

export function useFormContext() {
    return useContext(FormContext);
}

export function useFormObjectValue() {
    const { value } = useFormContext();
    const [json, setJSON] = useState(value.get());

    useEffect(() => {
        const obs = value.changed();
        const subscription = obs.subscribe(
            value => setJSON(value)
        );
        obs.next(value.get());
        return () => subscription.unsubscribe();
    }, [value]);

    return json;
}
