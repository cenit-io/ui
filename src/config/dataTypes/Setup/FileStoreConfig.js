import React from 'react';
import { CRUD } from "../../../actions/ActionRegistry";
import Alert from '@material-ui/lab/Alert';
import { eq } from "../../../services/BLoC";
import ConfigIcon from "@material-ui/icons/Settings";

export default {
  title: 'File Store Config',
  icon: <ConfigIcon component="svg" />,
  actions: {
    index: {
      fields: ['data_type', 'file_store', 'public_read', 'updated_at']
    },
    edit: {
      fields: ['id', 'migration_enabled', 'migration_in_progress', 'data_type', 'file_store', 'public_read']
    }
  },
  formSanitizer: ({ id, file_store, public_read }) => ({ id, file_store, public_read }),
  fields: {
    migration_enabled: {
      control: () => (
        <Alert severity="info">
          You're not able to change file store configs
        </Alert>
      )
    },
    migration_in_progress: {
      control: () => (
        <Alert severity="warning">
          Files from this type are currently on a migration process
        </Alert>
      )
    },
    data_type: {
      readOnly: true,
      controlProps: {
        editDisabled: true
      }
    },
    file_store: {
      controlProps: {
        deleteDisabled: true
      }
    },
    public_read: {
      controlProps: {
        deleteDisabled: true
      }
    }
  },
  dynamicConfig: ({ migration_in_progress, migration_enabled }, state, _, { readOnly }) => {
    const newState = {
      file_store: {
        readOnly: readOnly || migration_in_progress || !migration_enabled
      },
      public_read: {
        readOnly: readOnly || migration_in_progress || !migration_enabled
      },
      migration_in_progress: {
        hidden: !migration_in_progress
      },
      migration_enabled: {
        hidden: migration_enabled === undefined || migration_enabled
      }
    };
    if (!eq(newState, state)) {
      return newState;
    }
  },
  crud: [CRUD.read, CRUD.update]
};
