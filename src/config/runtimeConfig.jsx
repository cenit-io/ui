const DEFAULTS = {
  REACT_APP_APP_ID: "admin",
  REACT_APP_CENIT_HOST: "http://localhost:3000",
  REACT_APP_LOCALHOST: "http://localhost:3002",
};

function readImportMetaEnv(key) {
  if (typeof import.meta === "undefined" || !import.meta.env) return undefined;
  return import.meta.env[key];
}

export function runtimeValue(key) {
  if (typeof window !== "undefined" && window.appConfig && window.appConfig[key] !== undefined) {
    return window.appConfig[key];
  }
  const envValue = readImportMetaEnv(key);
  if (envValue !== undefined) return envValue;
  return DEFAULTS[key];
}

export function runtimeBoolean(key, fallback = false) {
  const value = runtimeValue(key);
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase() === "true";
}

export const runtimeConfig = {
  get appId() {
    return runtimeValue("REACT_APP_APP_ID");
  },
  get cenitHost() {
    return runtimeValue("REACT_APP_CENIT_HOST");
  },
  get localhost() {
    return runtimeValue("REACT_APP_LOCALHOST");
  },
  get useEnvironmentConfig() {
    return runtimeBoolean("REACT_APP_USE_ENVIRONMENT_CONFIG", true);
  },
};
