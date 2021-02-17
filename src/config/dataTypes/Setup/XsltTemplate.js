import React from "react";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";
import AutocompleteControl from "../../../components/AutocompleteControl";
import templateMimeOrchestrator  from "../../orchestrators/templateMimeOrchestrator";

const orchestrator = templateMimeOrchestrator('application/xml', [
    'application/xml',
    'text/html',
    'text/plain'
]);

export default {
    title: 'XSLT Template',
    icon: <TemplateFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'code']
        }
    },
    fields: {
        mime_type: {
            control: AutocompleteControl
        },
        file_extension: {
            control: AutocompleteControl
        },
        code: {
            control: StringCodeControl
        }
    },
    orchestrator
};
