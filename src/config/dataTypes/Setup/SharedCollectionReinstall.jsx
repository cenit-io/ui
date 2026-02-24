import React from 'react';
import commonTaskConfig from "./commonTaskConfig";
import ViewerControl from "../../../components/ViewerControl";

const SharedCollectionReinstall = commonTaskConfig('Shared Collection Reinstall', {
  shared_collection: {
    control: ViewerControl
  }
});

export default SharedCollectionReinstall;
