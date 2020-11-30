import React from 'react';
import AlgorithmFilledIcon from "../../../icons/AlgorithmFilledIcon";
import SharedCollectionFilledIcon from "../../../icons/SharedCollectionFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";

function orchestrator({ language }, state) {
    return {
        code: {
            mime: language === 'ruby' ? 'text/x-ruby' : 'text/javascript'
        },
        call_links: {
            addDisabled: true,
            deleteDisabled: true
        }
    }
}

const editFields = ['id', 'namespace', 'name', 'description', 'parameters', 'language', 'code', 'call_links'];
const editViewport = `{id ${editFields.join(' ')}}`;

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
            },
            orchestrator
        },
        edit: {
            fields: editFields,
            viewport: editViewport,
            seed: {
                language: 'ruby'
            },
            orchestrator
        }
    },
    fields: {
        code: {
            control: StringCodeControl
        }
    }
};
