import React from 'react';
import DataEventsFilledIcon from "../../../icons/DataEventsFilledIcon";
import FlowFilledIcon from "../../../icons/FlowFilledIcon";

export default {
    title: 'Data Event',
    icon: <DataEventsFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'data_type', 'triggers', 'trigger_evaluator', 'updated_at']
        }
    }
};
