import React from 'react';
import ApplicationFilledIcon from "../../../icons/ApplicationFilledIcon";
import { CRUD } from "../../../actions/ActionRegistry";

const fields = ['name', 'registered', 'trusted', 'oauth_name', 'slug', 'identifier', 'updated_at'];

export default {
  title: 'Application ID',
  icon: <ApplicationFilledIcon />,
  actions: {
    index: {
      fields
    },
    edit: {
      fields
    }
  },
  crud: [CRUD.read]
};
