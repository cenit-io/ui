import React, { useContext, useState, useEffect, useCallback } from 'react';
import { debounce } from "rxjs/operators";
import { interval } from "rxjs";

const FormContext = React.createContext({});

export default FormContext;

export function useFormContext() {
    return useContext(FormContext);
}

export function useFormObjectValue() {
    const { value } = useFormContext();
    const [json, setJSON] = useState(value.get());

    useEffect(() => {
        const subscription = value.changed().pipe(
            debounce(() => interval(200))
        ).subscribe(
            value => setJSON(value)
        );
        value.changed().next(value.get());
        return () => subscription.unsubscribe();
    }, [value]);

    return json;
}
