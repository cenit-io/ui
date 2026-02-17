import session from "./session";
import { runtimeConfig } from "../config/runtimeConfig";

const DEFAULT_BACKEND_HOST = runtimeConfig.cenitHost;

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
