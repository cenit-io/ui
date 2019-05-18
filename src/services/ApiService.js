import axios from "axios";

const Config = {
    cenitHost: 'http://127.0.0.1:3001',
    timeoutSpan: 10000,
    appIdentifier: '5ce182106ecd791bdb000011rHnmvs3zAc4SDRgiC3NVyynoH4cuGyD1YmsBm5VHAJpPv_ar6yNg9YT1SC3H',
};

const appGateway = axios.create({
    baseURL: `${Config.cenitHost}/app/${Config.appIdentifier}`,
    timeout: Config.timeoutSpan,
});

const ACCESS_KEY = 'access';

const getAccessToken = () => {
    return new Promise(
        (resolve, reject) => {
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
            if (access) {
                resolve(access.access_token);
            } else {
                appGateway.get('/')
                    .then(
                        (response) => {
                            localStorage.setItem(ACCESS_KEY, JSON.stringify(response.data));
                            resolve(response.data.access_token);
                        }
                    )
                    .catch(
                        (error) => {
                            reject(error);
                        }
                    )
            }
        }
    );
};

const apiGateway = axios.create({
    baseURL: `${Config.cenitHost}/api/v3`,
    timeout: Config.timeoutSpan
});

//const ApiCache = {};

export const ApiResource = function () {

    let args = Array.prototype.slice.call(arguments).flat(), params = args[args.length - 1], headers, size;

    if (params && params.constructor === Object) {
        params = args.pop();
        headers = params.headers;
        if (headers &&
            headers.constructor === Object &&
            ((size = Object.keys(params).length) === 1 || (size === 2 && params.params && params.params.constructor === Object))) {
            params = params.params || {}
        } else {
            headers = {}
        }
    } else {
        headers = params = {};
    }

    this.path = '/' + args.join('/');

    this.get = () => {
        return new Promise(
            (resolve, reject) => {
                getAccessToken()
                    .then(
                        access_token => {
                            apiGateway.get(this.path, {
                                headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                                params: params
                            })
                                .then(response => resolve(response.data))
                                .catch(error => reject(error))
                        }
                    )
                    .catch(error => reject(error))
            }
        );
    };

    this.post = (data) => {
        return new Promise(
            (resolve, reject) => {
                getAccessToken()
                    .then(
                        access_token => {
                            apiGateway.post(this.path, data, {
                                headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                                parameters: params
                            })
                                .then(response => resolve(response.data))
                                .catch(error => reject(error))
                        }
                    )
                    .catch(error => reject(error))
            }
        );
    };
};

const API = {
    get: (...args) => (new ApiResource(...args)).get(),

    post: (...args) => {
        const data = args.pop();
        return (new ApiResource(...args)).post(data);
    }
};

export default API;