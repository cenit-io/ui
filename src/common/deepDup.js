export default function deepDup(obj) {
    return JSON.parse(JSON.stringify(obj));
}
