const SIMPLE_TYPES = ["integer", "number", "string", "boolean"];

export const DECORATOR_PROPS = [
  "types",
  "contextual_params",
  "data",
  "filter",
  "group",
  "xml",
  "unique",
  "title",
  "description",
  "edi",
  "format",
  "example",
  "enum",
  "readOnly",
  "default",
  "visible",
  "referenced_by",
  "export_embedded",
  "exclusive",
];

export function isSimpleSchema(schema: { type?: string } | null | undefined) {
  return SIMPLE_TYPES.includes(schema?.type || "");
}

export function injectCommonProperties(schema?: Record<string, unknown> | null) {
  const properties = schema?.properties as Record<string, unknown> | undefined;
  if (!properties) return;

  if (!properties.created_at) {
    properties.created_at = {
      type: "string",
      format: "date-time",
      edi: { discard: true },
    };
  }

  if (!properties.updated_at) {
    properties.updated_at = {
      type: "string",
      format: "date-time",
      edi: { discard: true },
    };
  }
}

export function stripDecoratorProps(schema?: Record<string, unknown> | null) {
  if (!schema) return null;
  return Object.keys(schema).reduce<Record<string, unknown>>((acc, key) => {
    if (!DECORATOR_PROPS.includes(key)) {
      acc[key] = schema[key];
    }
    return acc;
  }, {});
}
