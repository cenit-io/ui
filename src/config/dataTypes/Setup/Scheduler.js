import React from 'react';
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";
import DataEventsFilledIcon from "../../../icons/DataEventsFilledIcon";
import SchedulerExpressionControl from "../../../components/SchedulerExpressionControl";

import '../../../actions/SwitchSchedulers';

export default {
    title: 'Scheduler',
    icon: <SchedulerFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'activated', 'expression', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'activated', 'expression']
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
