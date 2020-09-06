import React from 'react';
import AlgorithmFilledIcon from "../../../icons/AlgorithmFilledIcon";
import SharedCollectionFilledIcon from "../../../icons/SharedCollectionFilledIcon";

export default {
    title: 'Algorithm',
    icon: <AlgorithmFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'parameters_size', 'updated_at']
        }
    }
};
