import React from "react";
import ParserFilledIcon from "../../../icons/ParserFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

export default {
    title: 'Ruby Parser',
    icon: <ParserFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'code']
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
