import mime from "../../common/MIME";

export default function(codeMime, mimeOptions) {
    return function ({ mime_type, file_extension }, state, value) {
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
                    options: mimeOptions || Object.keys(mime.extensions)
                },
                file_extension: {
                    options: extensions
                },
                code: {
                    mime: codeMime || mime_type
                }
            }
        }
    }
}
