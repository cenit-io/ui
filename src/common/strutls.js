
export function underscore(str) {
    return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
