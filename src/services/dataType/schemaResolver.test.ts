import { describe, expect, it } from "vitest";

import { injectCommonProperties, isSimpleSchema, stripDecoratorProps } from "./schemaResolver";

describe("schemaResolver", () => {
  it("injects audit fields into object schema properties", () => {
    const schema: Record<string, unknown> = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    injectCommonProperties(schema);

    const properties = schema.properties as Record<string, unknown>;
    expect(properties.created_at).toBeTruthy();
    expect(properties.updated_at).toBeTruthy();
  });

  it("detects simple schema types", () => {
    expect(isSimpleSchema({ type: "string" })).toBe(true);
    expect(isSimpleSchema({ type: "object" })).toBe(false);
    expect(isSimpleSchema(undefined)).toBe(false);
  });

  it("strips decorator fields from schema", () => {
    const schema = {
      type: "string",
      format: "date-time",
      title: "A Title",
      custom: "keep-me",
    };

    expect(stripDecoratorProps(schema)).toEqual({ type: "string", custom: "keep-me" });
  });
});
