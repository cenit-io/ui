import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

export default {
    title: 'Handlebars Converter',
    icon: <ConverterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'code']
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        }
    }
};
