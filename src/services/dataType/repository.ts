export function buildTemplateOptionsHeader(viewport: string, includeId = false) {
  const options: Record<string, unknown> = { viewport };
  if (includeId) {
    options.include_id = true;
  }
  return {
    "X-Template-Options": JSON.stringify(options),
  };
}

export function buildFindSelectorHeaders(criteria: Record<string, unknown>) {
  return {
    "X-Template-Options": JSON.stringify({ viewport: "{_id}" }),
    "X-Query-Selector": JSON.stringify(criteria),
  };
}

export function buildDigestHeaders(
  viewport: string,
  sort: Record<string, unknown> = {},
  selector: Record<string, unknown> = {},
  polymorphic = true,
  includeId = false,
) {
  return {
    "X-Template-Options": JSON.stringify({
      viewport,
      polymorphic,
      include_id: includeId,
    }),
    "X-Query-Options": JSON.stringify({ sort }),
    "X-Query-Selector": JSON.stringify(selector),
  };
}
