import React from 'react';
import NamespaceIcon from "@mui/icons-material/Dns";

export default {
  title: 'Namespace',
  icon: <NamespaceIcon />,
  actions: {
    index: {
      fields: ['name', 'slug', 'updated_at']
    },
    new: {
      fields: ['name', 'slug']
    }
  }
};
