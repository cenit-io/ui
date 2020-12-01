import React from 'react';
import SnippetFilledIcon from "../../../icons/SnippetFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

const Types = {
    text: 'plain/text',
    ruby: 'text/x-ruby',
    javascript: 'application/json'
};

function orchestrator({ type }, state) {
    return {
        code: {
            mime: Types[type]
        }
    }
}

export default {
    title: 'Snippet',
    icon: <SnippetFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'type', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'description', 'type', 'code'],
            orchestrator
        },
        edit: {
            fields: ['id', 'namespace', 'name', 'description', 'type', 'code'],
            orchestrator
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        }
    }
};
