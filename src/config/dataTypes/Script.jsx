import React from 'react';

import ScriptIcon from '@mui/icons-material/CodeRounded';
import MenuIcon from '@mui/icons-material/CodeOutlined';

export const ScriptMenuIcon = MenuIcon;

export default {
  title: 'Script',
  icon: <ScriptIcon component="svg" />,
  actions: {
    index: {
      fields: ['name', 'description', 'updated_at'],
    },
    new: {
      fields: ['name', 'description', 'code']
    }
  }
};
