import axios from 'axios';
import AuthorizationService, { Config } from './AuthorizationService';
import { catchError, map, switchMap } from "rxjs/operators";
import { from, of } from "rxjs";

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
        return AuthorizationService.getAccessToken().pipe(
            switchMap(access_token => from(
                apiGateway.get(this.path, {
                    headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                    params: params
                })).pipe(map(response => response.data))
            )
        );
    };

    this.post = data => {
        return AuthorizationService.getAccessToken().pipe(
            switchMap(access_token => from(
                apiGateway.post(this.path, data, {
                    headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                    parameters: params
                })).pipe(map(response => response.data))
            )
        );
    };
};

const ErrorCallbacks = [];

const API = {
        get: (...args) => {
            return (new ApiResource(...args)).get().pipe(
                catchError(e => {
                    if (e.response.status !== 404) {
                        ErrorCallbacks.forEach(callback => callback(e));
                    }
                    return of(null);
                })
            )
        },

        post: (...args) => {
            const data = args.pop();
            return (new ApiResource(...args)).post(data).pipe(
                catchError(e => {
                    switch (e.response.status) {
                        case 404:
                            break;
                        case 422:
                            throw e;
                        default:
                            ErrorCallbacks.forEach(callback => callback(e));
                    }
                    return of(null);
                })
            );
        },

        onError: callback => ErrorCallbacks.push(callback)
    }
;

export default API;
