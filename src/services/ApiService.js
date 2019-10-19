import axios from 'axios';
import AuthorizationService, {Config} from './AuthorizationService';

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

    this.get = async () => {
        const access_token = await AuthorizationService.getAccessToken(),

            response = await apiGateway.get(this.path, {
                headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                params: params
            });

        return response.data;
    };

    this.post = async data => {
        const access_token = await AuthorizationService.getAccessToken(),

            response = await apiGateway.post(this.path, data, {
                headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                parameters: params
            });

        return response.data;
    };
};

const ErrorCallbacks = [];

const API = {
        get: async (...args) => {
            try {
                return await (new ApiResource(...args)).get()
            } catch (e) {
                if (e.response.status !== 404) {
                    ErrorCallbacks.forEach(callback => callback(e));
                }
                return null;
            }
        },

        post: async (...args) => {
            try {
                const data = args.pop();
                return await (new ApiResource(...args)).post(data);
            } catch (e) {
                switch (e.response.status) {
                    case 404:
                        return null;
                    case 422:
                        throw e;
                    default:
                        ErrorCallbacks.forEach(callback => callback(e));
                }
                return null;
            }
        },

        onError: callback => ErrorCallbacks.push(callback)
    }
;

export default API;
