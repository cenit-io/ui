import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

export default {
    title: 'Ruby Converter',
    icon: <ConverterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events',  'source_handler', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'source_handler', 'code']
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
