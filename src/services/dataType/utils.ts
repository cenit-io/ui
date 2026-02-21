export const JSON_TYPE = 'Setup::JsonDataType';
export const FILE_TYPE = 'Setup::FileDataType';
export const CENIT_TYPE = 'Setup::CenitDataType';

export function splitName(name: string): [string, string] {
    let namespace = "";
    const parts = name.split("::");
    let finalName = "";

    if (parts.length > 1) {
        finalName = parts.pop() || "";
        namespace = parts.join("::");
    } else {
        finalName = parts[0];
    }
    return [namespace, finalName];
}
