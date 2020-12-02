import React from "react";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";
import mime from 'mime-types';
import AutocompleteControl from "../../../components/AutocompleteControl";

const ExtraTypes = {
    'text/x-ruby': ['rb']
};

Object.keys(ExtraTypes).forEach(type => {
        let extensions = mime.extensions[type] || [];
        ExtraTypes[type].forEach(ext => {
            if (extensions.indexOf(ext) === -1) {
                extensions.push(ext);
            }
        });
        mime.extensions[type] = extensions;
    }
);

function orchestrator({ mime_type, file_extension }, state, value) {
    if (
        !state.mime_type?.options ||
        state.code?.mime !== mime_type ||
        state.mime_type.options.indexOf(mime_type) === -1 ||
        mime.extensions[mime_type].indexOf(file_extension) === -1
    ) {
        const extensions = mime.extensions[mime_type];
        value.propertyValue(
            'file_extension'
        ).set(
            (extensions && extensions[0]) || null,
            true
        );
        return {
            mime_type: {
                options: Object.keys(mime.extensions)
            },
            file_extension: {
                options: extensions
            },
            code: {
                mime: mime_type
            }
        }
    }
}

export default {
    title: 'ERB Template',
    icon: <TemplateFilledIcon/>,
    actions: {
        index: {
            fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'updated_at']
        },
        new: {
            fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'bulk_source', 'code']
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
