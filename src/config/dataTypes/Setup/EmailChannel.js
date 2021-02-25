import React from 'react';
import EmailChannelsFilledIcon from "../../../icons/EmailChannelsFilledIcon";

export default {
    title: 'EMail Channel',
    icon: <EmailChannelsFilledIcon/>,
    actions: {
        index: {
            fields: ['_type', 'namespace', 'name', 'updated_at']
        }
    }
};
