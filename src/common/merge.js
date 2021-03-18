import merge from "deepmerge";

export function onMergeOverride(target, source, options) {
    return source;
}

export function deepMergeObjectsOnly(target, source) {
    return merge(target, source, { arrayMerge: onMergeOverride, clone: false })
}

export function deepMergeArrayConcat(target, source) {
    return merge(target, source);
}
