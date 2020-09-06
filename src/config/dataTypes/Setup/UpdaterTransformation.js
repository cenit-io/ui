import React from 'react';
import UpdaterFilledIcon from "../../../icons/UpdaterFilledIcon";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";

export default {
    title: 'Updater',
    icon: <UpdaterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'updated_at']
        }
    }
};
