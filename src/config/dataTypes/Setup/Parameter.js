import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import recordViewer from "../../../viewers/recordViewer";
import ParameterIcon from "@material-ui/icons/Settings";

const editFields = ['key', 'value', 'description', 'metadata'];

export default {
  title: 'Parameter',
  icon: <ParameterIcon component="svg" />,
  actions: {
    index: {
      fields: ['parent_data_type', 'parent', 'location', 'key', 'value', 'description', 'updated_at']
    },
    new: {
      fields: editFields,
      seed: {
        metadata: {}
      }
    },
    edit: {
      fields: editFields
    }
  },
  fields: {
    parent: {
      viewer: recordViewer(p => p?.parent_data_type)
    }
  },
  crud: [CRUD.read, CRUD.delete]
};
