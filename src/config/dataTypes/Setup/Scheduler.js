import React from 'react';
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";
import SchedulerExpressionControl from "../../../components/SchedulerExpressionControl";

import '../../../actions/SwitchSchedulers';
import ViewerControl from "../../../components/ViewerControl";

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
            control: ViewerControl
        }
    }
};
