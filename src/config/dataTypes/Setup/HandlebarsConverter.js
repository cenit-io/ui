import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import SharedCode from "../../../components/SharedCode";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'code'];

export default {
    title: 'Handlebars Converter',
    icon: <ConverterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'updated_at']
        },
        new: { fields },
        edit: {
            viewportFields: [...fields, 'origin']
        }
    },
    fields: {
        code: {
            control: SharedCode
        }
    },
    orchestrator: sharedOriginFields(...arrayDiff(fields, 'code'))
};
