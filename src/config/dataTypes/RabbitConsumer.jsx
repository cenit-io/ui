import React from 'react';
import { CRUD } from "../../actions/ActionRegistry";

// import RabbitConsumerIcon from '@mui/icons-material/RunCircle';
import RabbitConsumerIcon from '@mui/icons-material/PlayCircleFilledWhite';
// import MenuIcon from '@mui/icons-material/RunCircleOutlined';
import MenuIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';

export const RabbitConsumerMenuIcon = MenuIcon;

export default {
  title: 'Rabbit Consumer',
  icon: <RabbitConsumerIcon component="svg" />,
  actions: {
    index: {
      fields: ['channel', 'tag', 'executor', 'alive', 'updated_at']
    }
  },
  crud: [CRUD.read]
};
