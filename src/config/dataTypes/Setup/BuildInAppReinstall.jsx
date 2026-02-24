import React from 'react';
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const BuildInAppResintall = commonTaskConfig('Build-in App Reinstall', {
  build_in_app: {
    control: ViewerControl
  }
});

export default BuildInAppResintall;
