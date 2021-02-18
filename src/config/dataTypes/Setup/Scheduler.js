import React from 'react';
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";
import SchedulerExpressionControl from "../../../components/SchedulerExpressionControl";

import '../../../actions/SwitchSchedulers';

const fields = ['namespace', 'name', 'activated', 'expression'];

export default {
    title: 'Scheduler',
    icon: <SchedulerFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'activated', 'expression', 'updated_at']
        },
        new: {
            fields
        },
        edit: {
            viewportFields: [...fields, 'origin']
        }
    },
    fields: {
        expression: {
            control: SchedulerExpressionControl
        },
        activated: {
            readOnly: true
        }
    }
};
