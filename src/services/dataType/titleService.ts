export function deriveDataTypeTitle(name?: string) {
  if (!name) return "";
  return name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

interface GenericItem {
  id?: string;
  title?: string;
  namespace?: string;
  name?: string;
  origin?: string;
  [key: string]: unknown;
}

export function deriveItemTitle(item: GenericItem, dataTypeTitle: string, appendOrigin = false) {
  let title =
    item.title ||
    ((item.namespace && item.name && `${item.namespace} | ${item.name}`) || item.name) ||
    `${dataTypeTitle} ${item.id || "(blank)"}`;

  if (appendOrigin && item.origin !== undefined && item.origin !== "default") {
    title = `${title} [${item.origin}]`;
  }

  return title;
}
