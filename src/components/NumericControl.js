import React from 'react';
import { Failed } from "../common/Symbols";
import InputControl from "./InputControl";


function parseNumber(value) {
    if (value === '-') {
        return 0;
    }

    if (isNaN(value)) {
        return Failed;
    }

    return +value;
}

function NumericControl(props) {
    return (
        <InputControl parser={parseNumber} {...props}/>
    );
}

export default NumericControl;
