import { describe, expect, it } from "vitest";
import { runtimeConfig } from "./runtimeConfig";

describe("runtimeConfig", () => {
  it("reads window.appConfig lazily after module import", () => {
    const original = window.appConfig;
    try {
      delete window.appConfig;
      expect(runtimeConfig.cenitHost).toBe("http://localhost:3000");

      window.appConfig = {
        REACT_APP_CENIT_HOST: "https://api.cenit-dev.openipaas.link",
        REACT_APP_LOCALHOST: "https://cenit-dev.openipaas.link",
        REACT_APP_APP_ID: "admin",
        REACT_APP_USE_ENVIRONMENT_CONFIG: "true",
      };

      expect(runtimeConfig.cenitHost).toBe("https://api.cenit-dev.openipaas.link");
      expect(runtimeConfig.localhost).toBe("https://cenit-dev.openipaas.link");
      expect(runtimeConfig.appId).toBe("admin");
      expect(runtimeConfig.useEnvironmentConfig).toBe(true);
    } finally {
      window.appConfig = original;
    }
  });
});
