import React from 'react';
import StringControl from "./StringControl";
import { Failed } from "../common/Symbols";


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
        <StringControl parser={parseNumber} {...props}/>
    );
}

export default NumericControl;
