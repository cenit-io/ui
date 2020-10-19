import React from 'react';
import TransformationFilledIcon from "../../../icons/TransformationFilledIcon";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";

export default {
    title: 'Transformation',
    icon: <TransformationFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', '_type', 'updated_at']
        }
    }
};
