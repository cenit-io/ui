import React from 'react';
import ConfigurationIcon from "@material-ui/icons/SettingsApplications";
import Index from "../../../actions/Index";
import Configuration from "../../../components/Configuration";

export default {
  title: 'Configuration',
  itemLabel: () => 'Configuration',
  icon: <ConfigurationIcon component="svg" />,
  actions: {
    edit: {
      fields: ['email_data_type', 'observer_tenant', 'default_build_in_tenant']
    },
    index: {
      component: Configuration,
      icon: ConfigurationIcon
    }
  },
  onlyActions: [Index]
};
