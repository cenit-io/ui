import React from 'react';
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";
import DataEventsFilledIcon from "../../../icons/DataEventsFilledIcon";

export default {
    title: 'Scheduler',
    icon: <SchedulerFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'expression', 'activated', 'updated_at']
        }
    }
};
