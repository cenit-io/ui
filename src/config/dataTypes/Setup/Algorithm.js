import React from 'react';
import AlgorithmFilledIcon from "../../../icons/AlgorithmFilledIcon";
import SharedCode from "../../../components/SharedCode";
import mergeOrchestrators from "../../orchestrators/mergeOrchestrators";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const editFields = ['id', 'namespace', 'name', 'description', 'parameters', 'language', 'code', 'call_links'];

const orchestrator = mergeOrchestrators(
    ({ language }, state) => {
        const mime = language === 'ruby' ? 'text/x-ruby' : 'text/javascript';
        if (state.code?.mime !== mime) {
            return {
                code: {
                    mime
                }
            }
        }
    },
    sharedOriginFields(...arrayDiff(editFields, 'code'))
);

const viewport = `{id ${editFields.join(' ')} origin}`;

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
            fields: editFields,
            viewport
        }
    },
    fields: {
        code: {
            control: SharedCode
        },
        call_links: {
            controlProps: {
                addDisabled: true,
                deleteDisabled: true,
                sortDisabled: true
            }
        },
        parameters: {
            seed: (_dt, value) => {
                const items = value.get() || [];
                return {
                    required: !items.length || !!items[items.length - 1]?.required
                };
            }
        }
    },
    orchestrator
};
