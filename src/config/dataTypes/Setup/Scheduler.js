import React from 'react';
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";
import DataEventsFilledIcon from "../../../icons/DataEventsFilledIcon";
import SchedulerExpressionControl from "../../../components/SchedulerExpressionControl";

export default {
    title: 'Scheduler',
    icon: <SchedulerFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'expression', 'activated', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'expression']
        }
    },
    fields: {
        expression: {
            control: SchedulerExpressionControl
        }
    }
};
