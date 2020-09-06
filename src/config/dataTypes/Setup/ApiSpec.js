import React from 'react';
import ApiSpecsFilledIcon from "../../../icons/ApiSpecsFilledIcon";

export default {
    title: 'API Spec',
    icon: <ApiSpecsFilledIcon/>,
    actions: {
        index: {
            fields: ['title', 'url', 'updated_at']
        }
    }
};
