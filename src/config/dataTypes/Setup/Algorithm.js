import React from 'react';
import AlgorithmFilledIcon from "../../../icons/AlgorithmFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

function orchestrator({ language }, state) {
    const mime = language === 'ruby' ? 'text/x-ruby' : 'text/javascript';
    if (state.code?.mime !== mime) {
        return {
            code: {
                mime
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
            fields: ['namespace', 'name', 'description', 'parameters', 'language', 'code', 'call_links']
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        },
        call_links: {
            controlProps: {
                addDisabled: true,
                deleteDisabled: true,
                sortDisabled: true
            }
        }
    },
    orchestrator
};
