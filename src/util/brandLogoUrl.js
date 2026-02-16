import session from "./session";

const DEFAULT_BACKEND_HOST = "https://server.cenit.io";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export default function brandLogoUrl() {
  const runtimeHost =
    session.cenitBackendBaseUrl ||
    (window.appConfig && window.appConfig.REACT_APP_CENIT_HOST) ||
    DEFAULT_BACKEND_HOST;

  return `${trimTrailingSlash(runtimeHost)}/images/brandLogo.svg`;
}
