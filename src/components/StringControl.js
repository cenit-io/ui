import React from 'react';
import InputControl from "./InputControl";

function StringControl(props) {

    const { minLength } = props.schema;

    const validator = str => {
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
    };

    return (
        <InputControl {...props} validator={validator}/>
    );
}

export default StringControl;
