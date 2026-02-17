import React from 'react';
import CenitTypesFilledIcon from "../../../icons/CenitTypesFilledIcon";
import { CRUD } from "../../../actions/ActionRegistry";

export default {
  title: 'Cenit Type',
  icon: <CenitTypesFilledIcon />,
  crud: [CRUD.read],
  actions: {
    index: {
      fields: ['namespace', 'name', 'slug', 'updated_at']
    }
  }
};
