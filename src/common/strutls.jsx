export function underscore(str) {
  return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleize(str) {
  return underscore(str)
    .split(/\s|-|_/)
    .map(token => token.trim())
    .filter(token => token)
    .map(token => capitalize(token))
    .join(' ');
}
