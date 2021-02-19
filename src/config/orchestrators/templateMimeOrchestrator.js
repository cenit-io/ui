import mime from "../../common/MIME";
import { eq } from "../../services/BLoC";
import mergeOrchestrators from "./mergeOrchestrators";
import sharedOriginFields from "./sharedOriginFields";

export default function (readOnlyFields, codeMime, mimeOptions) {
    return mergeOrchestrators(
        function ({ mime_type, file_extension }, state, value) {
            if ((mime_type || !state.mime_type?.options?.length) && (
                !state.mime_type?.options ||
                state.code?.mime !== (codeMime || mime_type) ||
                state.mime_type.options.indexOf(mime_type) === -1 ||
                mime.extensions[mime_type].indexOf(file_extension) === -1
            )) {
                const extensions = mime.extensions[mime_type];
                const ext = (extensions && extensions[0]) || null;
                if (!eq(ext, file_extension)) {
                    value.propertyValue(
                        'file_extension'
                    ).set(ext, true);
                }
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
        },
        sharedOriginFields(...readOnlyFields)
    );
}
