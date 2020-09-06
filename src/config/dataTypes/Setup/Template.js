import React from 'react';
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";
import SchedulerFilledIcon from "../../../icons/SchedulerFilledIcon";

export default {
    title: 'Template',
    icon: <TemplateFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'updated_at']
        }
    }
};
