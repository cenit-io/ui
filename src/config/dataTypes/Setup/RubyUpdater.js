import React from "react";
import UpdaterFilledIcon from "../../../icons/UpdaterFilledIcon";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";
import SharedCode from "../../../components/SharedCode";

const fields = ['namespace', 'name', 'target_data_type', 'discard_events', 'source_handler', 'code'];

export default {
    title: 'Ruby Updater',
    icon: <UpdaterFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'source_handler', 'updated_at']
        },
        new: { fields },
        edit: {
            viewportFields: [...fields, 'origin']
        }
    },
    fields: {
        code: {
            control: SharedCode,
            controlProps: {
                mime: 'text/x-ruby'
            }
        }
    },
    orchestrator: sharedOriginFields(...arrayDiff(fields, 'code'))
};
