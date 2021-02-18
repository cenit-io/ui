
export function arrayDiff(array, ...elements) {
    return array.filter(e => !elements.includes(e));
}
