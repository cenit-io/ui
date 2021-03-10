import React from 'react';
import commonTaskConfig from "./Setup/commonTaskConfig";
import ViewerControl from "../../components/ViewerControl";

const ScriptExecution = commonTaskConfig('Script Execution', {
    script: {
        control: ViewerControl
    }
});

export default ScriptExecution;
