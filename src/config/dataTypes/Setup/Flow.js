import React from 'react';
import FlowFilledIcon from "../../../icons/FlowFilledIcon";
import SnippetFilledIcon from "../../../icons/SnippetFilledIcon";

export default {
    title: 'Flow',
    icon: <FlowFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'active', 'event', 'translator', 'updated_at']
        }
    }
};
