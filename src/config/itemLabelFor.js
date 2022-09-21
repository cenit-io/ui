export default function (dataTypeTitle) {
  return ({ namespace, name, id }) => {
    if (namespace || name) {
      return `${namespace || 'default'} | ${name || '?'}`;
    }

    if (id) {
      return `${dataTypeTitle} #${id}`;
    }

    return `${dataTypeTitle} (blank)`;
  }
}
