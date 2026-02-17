import React from 'react';
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const AlgorithmExecution = commonTaskConfig('Algorithm Execution', {
  algorithm: {
    control: ViewerControl
  }
});

export default AlgorithmExecution;
