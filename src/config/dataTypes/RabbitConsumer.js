import React from 'react';
import { CRUD } from "../../actions/ActionRegistry";

// import RabbitConsumerIcon from '@material-ui/icons/RunCircle';
import RabbitConsumerIcon from '@material-ui/icons/PlayCircleFilledWhite';
// import MenuIcon from '@material-ui/icons/RunCircleOutlined';
import MenuIcon from '@material-ui/icons/PlayCircleFilledWhiteOutlined';

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
