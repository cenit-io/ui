import React from 'react';
import DataEventsFilledIcon from "../../../icons/DataEventsFilledIcon";
import LegacyTriggerControl from "../../../components/LegacyTriggerControl";

function dynamicConfig({ data_type, triggers, trigger_evaluator }, state) {
    console.log(data_type);
    if (data_type) {
        if (triggers && triggers !== '{}') {
            if (state.triggers || !state.trigger_evaluator) {
                return {
                    trigger_evaluator: {
                        hidden: true
                    }
                }
            }
        } else if (trigger_evaluator) {
            if (state.trigger_evaluator || !state.triggers) {
                return {
                    triggers: {
                        hidden: true
                    }
                }
            }
        } else if (state.triggers || state.trigger_evaluator) {
            return {};
        }
    } else if (!state.triggers || !state.trigger_evaluator) {
        return {
            triggers: {
                hidden: true
            },
            trigger_evaluator: {
                hidden: true
            },
        }
    }
}

export default {
    title: 'Data Event',
    icon: <DataEventsFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'data_type', 'triggers', 'trigger_evaluator', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'data_type', 'triggers', 'trigger_evaluator']
        }
    },
    fields: {
        data_type: {
            controlProps: {
                editDisabled: true
            }
        },
        triggers: {
            control: LegacyTriggerControl
        },
        trigger_evaluator: {
            selector: {
                parameters_size: {
                    $gte: 1,
                    $lte: 2
                }
            }
        }
    },
    dynamicConfig
};
