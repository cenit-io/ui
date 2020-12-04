import React from "react";
import UpdaterFilledIcon from "../../../icons/UpdaterFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

export default {
    title: 'Ruby Updater',
    icon: <UpdaterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'source_handler', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'source_handler', 'code']
        }
    },
    fields: {
        code: {
            control: StringCodeControl,
            controlProps: {
                mime: 'text/x-ruby'
            }
        }
    }
};
