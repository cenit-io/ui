import React from 'react';
import { StringValidator } from "./StringControl";
import CodeMirrorControl from "./CodeMirrorControl";


function StringCodeControl(props) {

    return (
        <CodeMirrorControl lineNumbers={true}
                           {...props}
                           validator={StringValidator(props.schema)}/>
    );
}

export default StringCodeControl;
