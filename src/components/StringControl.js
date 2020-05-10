import React from 'react';
import InputControl from "./InputControl";

export function StringValidator(schema) {
    return function (str) {

        const { minLength } = schema;

        if (str) {
            const errors = [];

            if (minLength && str.length < minLength) {
                errors.push('is too short');
            }

            if (errors.length) {
                return errors;
            }
        }

        return null;
    }
}

function StringControl(props) {

    return (
        <InputControl {...props} validator={StringValidator(props.schema)}/>
    );
}

export default StringControl;
