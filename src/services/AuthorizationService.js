import axios from "axios";
import Random from "../util/Random";
import { from, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

export const AppConfig = window.appConfig;

const EnvironmentConfig = {
    localhost: process.env.REACT_APP_LOCALHOST,
    cenitHost: process.env.REACT_APP_CENIT_HOST,
    timeoutSpan: +process.env.REACT_APP_TIMEOUT_SPAN,
    appIdentifier: process.env.REACT_APP_APP_ID
};

export const Config = AppConfig.useEnvironmentConfig ? EnvironmentConfig : AppConfig;

export const CenitHostKey = 'cenitHost';

Config.getCenitHost = function () {
    return sessionStorage.getItem(CenitHostKey) || Config.cenitHost;
};

let _appGateway = null;

export const AppGateway = function () {
    if (!_appGateway || _appGateway.baseUrl !== Config.getCenitHost()) {
        console.log(`Creating app gateway for ${Config.getCenitHost()}`);
        return _appGateway = axios.create({
            baseURL: `${Config.getCenitHost()}/app/${Config.appIdentifier}`,
            timeout: Config.timeoutSpan,
        });
    }

    return _appGateway;
};

export const AccessKey = 'access';

const getAuthorizeURL = () => `${Config.getCenitHost()}/app/${Config.appIdentifier}/authorize?redirect_uri=${Config.localhost}`;

const LogoutURL = `${Config.getCenitHost()}/users/sign_out`;

const StateKeyPrefix = 'state-';

const stateKey = state => `${StateKeyPrefix}${state}`;

const isStateKey = key => key.startsWith(StateKeyPrefix);

const TENANT_ID_KEY = 'tenantId';

const BANED_QUERY_PARAMS = ['cenitHost', 'code', 'state'];

export const AuthorizationService = {

    xTenantId: localStorage.getItem(TENANT_ID_KEY),

    getXTenantId: function () {
        return this.xTenantId;
    },

    setXTenantId: function (id) {
        localStorage.setItem(TENANT_ID_KEY, id);
        this.xTenantId = id;
    },

    authorize: () => {
        Object.keys(localStorage).forEach(key => {
            if (isStateKey(key)) {
                localStorage.removeItem(key);
            }
        });
        const state = Random.string();
        localStorage.setItem(stateKey(state), window.location);
        window.location = `${getAuthorizeURL()}&state=${state}`;
    },

    getAccess: function () {
        let access;
        try {
            access = JSON.parse(localStorage.getItem(AccessKey));
            let expirationDate = new Date(access.created_at + access.expires_in + Config.timeoutSpan);
            if (expirationDate < new Date() || access.host !== Config.getCenitHost()) {
                access = null;
            }
        } catch (e) {
            access = null;
        }

        if (!access) {
            this.authorize();
        }

        return of(access);
    },

    getAccessToken: function () {
        return this.getAccess().pipe(
            map(access => (access && access.access_token) || null)
        );
    },

    cleanAccess: function () {
        localStorage.removeItem(AccessKey);
    },

    getAccessWith: params => {
        return from(AppGateway().post('token', params.code)).pipe(
            map(response => {
                const access = response.data;

                localStorage.setItem(AccessKey, JSON.stringify(access));

                const key = stateKey(params.state);
                const prevLocation = localStorage.getItem(key);

                localStorage.removeItem(key);

                if (prevLocation) {
                    let [url, ...query] = prevLocation.split('?');
                    query = query
                        .join('?')
                        .split('&')
                        .filter(param => !BANED_QUERY_PARAMS.find(
                            baned => param.startsWith(baned)
                        ))
                        .join('&');
                    if (query) {
                        url = `${url}?${query}`;
                    }
                    window.location.replace(url);
                }

                return access;
            })
        );
    },

    getIdToken: function () {
        if (this.idToken) {
            return of(this.idToken);
        }

        return this.getAccess().pipe(
            map(access => {
                if (access) {
                    const base64 = access.id_token.split('.')[1]
                        .replace('-', '+')
                        .replace('_', '/');
                    this.idToken = JSON.parse(window.atob(base64));
                }
                return this.idToken;
            })
        );
    },

    logout: function () {
        localStorage.removeItem(AccessKey);
        window.location = LogoutURL;
    },

    config: function (data = {}) {
        return this.getAccess().pipe(
            switchMap(access => from(
                AppGateway().post('config', data, {
                    headers: { Authorization: `Bearer ${access.access_token}` }
                })
            ).pipe(map(response => response.data)))
        );
    },

    request: function (opts) {
        return this.getAccess().pipe(
            switchMap(
                access => {
                    const headers = { ...opts.headers };
                    headers.Authorization = `Bearer ${access.access_token}`;
                    opts = { ...opts, headers };
                    return from(axios(opts));
                }
            ),
            map(
                response => response.data
            )
        );
    }
};

export default AuthorizationService;
