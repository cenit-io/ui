import { describe, expect, it, vi, beforeEach } from "vitest";
import { firstValueFrom } from "rxjs";
import { Buffer } from "buffer";

const sessionMock = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
  cenitBackendBaseUrl: "http://localhost:3000",
};

const requestMock = {
  request: vi.fn(),
  authorize: vi.fn(),
  authWithAuthCode: vi.fn(),
  apiRequest: vi.fn(),
};

vi.mock("../util/session", () => ({
  default: sessionMock,
}));

vi.mock("../util/request", () => requestMock);

vi.mock("../config/runtimeConfig", () => ({
  runtimeConfig: {
    appId: "admin",
  },
}));

describe("AuthorizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests authorization when access token is missing", async () => {
    sessionMock.get.mockImplementation((key: string) => {
      if (key === "accessToken") return null;
      return undefined;
    });

    const { getAccess } = await import("./AuthorizationService");
    const access = await firstValueFrom(getAccess());

    expect(access).toBeNull();
    expect(requestMock.authorize).toHaveBeenCalledTimes(1);
  });

  it("decodes id token and persists it in session", async () => {
    const payload = { email: "support@cenit.io", name: "Cenit User" };
    const base64 = Buffer.from(JSON.stringify(payload), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    sessionMock.get.mockImplementation((key: string) => {
      if (key === "idToken") return null;
      if (key === "accessToken") {
        return { id_token: `header.${base64}.signature` };
      }
      return undefined;
    });

    const { getIdToken } = await import("./AuthorizationService");
    const idToken = await firstValueFrom(getIdToken());

    expect(idToken).toMatchObject(payload);
    expect(sessionMock.set).toHaveBeenCalledWith("idToken", expect.objectContaining(payload));
  });
});
