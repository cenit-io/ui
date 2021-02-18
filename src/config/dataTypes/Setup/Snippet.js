import React from 'react';
import SnippetFilledIcon from "../../../icons/SnippetFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";
import mergeOrchestrators from "../../orchestrators/mergeOrchestrators";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";

const Types = {
    text: 'plain/text',
    ruby: 'text/x-ruby',
    javascript: 'application/json'
};

const fields = ['namespace', 'name', 'description', 'type', 'code'];

const orchestrator = mergeOrchestrators(
    ({ type }, state) => {
        const mime = Types[type];
        if (state.code?.mime !== mime) {
            return {
                code: { mime }
            }
        }
    },
    sharedOriginFields(...fields)
);

export default {
    title: 'Snippet',
    icon: <SnippetFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'type', 'updated_at']
        },
        new: {
            fields
        },
        edit: {
            viewport: `{id ${fields.join(' ')} origin}`
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        }
    },
    orchestrator
};
