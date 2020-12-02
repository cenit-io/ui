import React from 'react';
import AlgorithmFilledIcon from "../../../icons/AlgorithmFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

function orchestrator({ language }, state) {
    const mime = language === 'ruby' ? 'text/x-ruby' : 'text/javascript';
    if (state.code?.mime !== mime) {
        return {
            code: {
                mime
            },
            call_links: { // TODO Move to call_links field config
                addDisabled: true,
                deleteDisabled: true,
                sortDisabled: true
            }
        }
    }
}

export default {
    title: 'Algorithm',
    icon: <AlgorithmFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'description', 'parameters_size', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'description', 'parameters', 'language', 'code'],
            seed: {
                language: 'ruby'
            }
        },
        edit: {
            seed: {
                language: 'ruby'
            }
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        }
    },
    orchestrator
};
