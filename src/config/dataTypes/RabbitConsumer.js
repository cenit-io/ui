import React from 'react';
import { CRUD } from "../../actions/ActionRegistry";

import '../../actions/CancelConsumers';

export default {
    title: 'Rabbit Consumer',
    actions: {
        index: {
            fields: ['channel', 'tag', 'executor', 'alive', 'updated_at']
        }
    },
    crud: [CRUD.read]
};
