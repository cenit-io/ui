import React from 'react';
import { Failed } from "../common/Symbols";
import NumericControl from "./NumericControl";


function parseInteger(value) {
    if (value === '-') {
        return 0;
    }

    if (!isNaN(value)) {
        value = +value;
        if (Number.isInteger(value)) {
            return value;
        }
    }

    return Failed;
}

function IntegerControl(props) {
    return (
        <NumericControl parser={parseInteger} {...props}/>
    );
}

export default IntegerControl;
