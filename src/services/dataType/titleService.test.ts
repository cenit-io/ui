import { describe, expect, it } from "vitest";

import { deriveDataTypeTitle, deriveItemTitle } from "./titleService";

describe("titleService", () => {
  it("normalizes data type title from name", () => {
    expect(deriveDataTypeTitle("oauth_access_grant")).toBe("Oauth_access_grant");
  });

  it("builds item title preferring title, then namespace/name, then fallback", () => {
    expect(deriveItemTitle({ title: "Custom" }, "Contact")).toBe("Custom");
    expect(deriveItemTitle({ namespace: "Setup", name: "Flow" }, "Contact")).toBe("Setup | Flow");
    expect(deriveItemTitle({ id: "abc" }, "Contact")).toBe("Contact abc");
  });

  it("appends origin when requested", () => {
    expect(deriveItemTitle({ id: "1", origin: "custom" }, "Contact", true)).toBe("Contact 1 [custom]");
  });
});
