import React from 'react';
import commonTaskConfig from "./Setup/commonTaskConfig";
import ViewerControl from "../../components/ViewerControl";

const ScriptExecution = commonTaskConfig('API Spec Import', {
    script: {
        control: ViewerControl
    }
});

export default ScriptExecution;
