
export function underscore(str) {
    return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}
