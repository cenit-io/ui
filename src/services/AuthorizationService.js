import axios from "axios";
import Random from "../util/Random";

export const Config = {
    localhost: 'http://localhost:3000',
    cenitHost: 'http://127.0.0.1:3001',
    timeoutSpan: 10000,
    appIdentifier: 'admin',
};

const appGateway = axios.create({
    baseURL: `${Config.cenitHost}/app/${Config.appIdentifier}`,
    timeout: Config.timeoutSpan,
});

const ACCESS_KEY = 'access';

const AuthorizeURL = `${Config.cenitHost}/app/${Config.appIdentifier}/authorize?redirect_uri=${Config.localhost}`;

const LogoutURL = `${Config.cenitHost}/users/sign_out`;

const AuthorizationService = {

    authorize: () => {
        const state = Random.string();
        localStorage.setItem(state, window.location);
        window.location.href = `${AuthorizeURL}&state=${state}`;
    },

    getAccess: async function () {
        let access;
        try {
            access = JSON.parse(localStorage.getItem(ACCESS_KEY));
            let expirationDate = new Date(access.created_at + access.expires_in + Config.timeoutSpan);
            if (expirationDate < new Date()) {
                access = null;
            }
        } catch (e) {
            access = null;
        }

        if (!access) {
            this.authorize();
        }

        return access;
    },

    getAccessToken: async function () {
        let access = await this.getAccess();

        if (access) {
            return access.access_token;
        }

        return null;
    },

    getAccessWith: async params => {
        const access = (await appGateway.post('token', params.code)).data;

        localStorage.setItem(ACCESS_KEY, JSON.stringify(access));

        const prevLocation = localStorage.getItem(params.state);

        localStorage.removeItem(params.state);

        if (prevLocation) {
            window.location = prevLocation;
        }

        return access;
    },

    getIdToken: async function () {
        if (!this.idToken) {
            let access = await this.getAccess();

            if (access) {
                const base64 = access.id_token.split('.')[1]
                    .replace('-', '+')
                    .replace('_', '/');
                this.idToken = JSON.parse(window.atob(base64));
            }

        }
        return this.idToken;
    },

    logout: function () {
        localStorage.removeItem(ACCESS_KEY);
        window.location = LogoutURL;
    }
};

export default AuthorizationService;