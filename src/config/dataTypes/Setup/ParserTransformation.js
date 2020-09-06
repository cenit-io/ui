import React from 'react';
import ParserFilledIcon from "../../../icons/ParserFilledIcon";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";

export default {
    title: 'Parser',
    icon: <ParserFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'target_data_type', 'updated_at']
        }
    }
};
