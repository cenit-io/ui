import React from 'react';
import SharedCollectionFilledIcon from "../../../icons/SharedCollectionFilledIcon";

export default {
    title: 'Shared Collection',
    icon: <SharedCollectionFilledIcon/>,
    actions: {
        index: {
            fields: ['name', 'title', 'updated_at']
        }
    }
};
