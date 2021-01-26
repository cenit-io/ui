import axios from 'axios';
import AuthorizationService, { Config } from './AuthorizationService';
import { catchError, map, switchMap } from "rxjs/operators";
import { from, of } from "rxjs";
import { Status } from "../common/Symbols";

const apiGateway = axios.create({
    baseURL: `${Config.getCenitHost()}/api/v3`,
    timeout: Config.timeoutSpan
});

//const ApiCache = {};

export const ApiResource = function () {

    let args = Array.prototype.slice.call(arguments).flat();
    let params = args[args.length - 1];
    let headers;
    let size;
    let onUploadProgress;
    let cancelToken;
    let responseType;

    if (params && params.constructor === Object) {
        params = args.pop();

        onUploadProgress = params.onUploadProgress;
        delete params.onUploadProgress;
        cancelToken = params.cancelToken;
        delete params.cancelToken;
        responseType = params.responseType;
        delete params.responseType;

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

    const config = {
        params,
        onUploadProgress,
        cancelToken,
        responseType
    };

    this.path = '/' + args.join('/');

    this.get = () => {
        return AuthorizationService.getAccessToken().pipe(
            switchMap(access_token => from(
                apiGateway.get(this.path, {
                    headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                    ...config
                })).pipe(map(response => response.data))
            )
        );
    };

    this.delete = () => {
        return AuthorizationService.getAccessToken().pipe(
            switchMap(access_token => from(
                apiGateway.delete(this.path, {
                    headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                    ...config
                })).pipe(map(response => response && response.data))
            )
        );
    };

    this.post = data => {
        return AuthorizationService.getAccessToken().pipe(
            switchMap(access_token => from(
                apiGateway.post(this.path, data, {
                    headers: { 'Authorization': 'Bearer ' + access_token, ...headers },
                    ...config
                })).pipe(map(response => {
                    const { data } = response;
                    if (data?.constructor === Object) {
                        data[Status] = response.status;
                    }
                    return data;
                }))
            )
        );
    };
};

const ErrorCallbacks = [];

const API = {
    get: (...args) => {
        return (new ApiResource(...args)).get().pipe(
            catchError(e => {
                if (axios.isCancel(e)) {
                    throw e;
                }
                if (e.response && e.response.status !== 404) {
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
                if (e.response) {
                    switch (e.response.status) {
                        case 404:
                            break;
                        case 422:
                            throw e;
                        default:
                            ErrorCallbacks.forEach(callback => callback(e));
                    }
                    return of(null);
                }
                throw e;
            })
        );
    },

    delete: (...args) => {
        return (new ApiResource(...args)).delete().pipe(
            catchError(e => {
                if (axios.isCancel(e)) {
                    throw e;
                }
                if (e.response) {
                    switch (e.response.status) {
                        case 404:
                        case 422:
                            break;
                        default:
                            ErrorCallbacks.forEach(callback => callback(e));
                    }
                }
                throw e;
            })
        );
    },

    onError: callback => ErrorCallbacks.push(callback)
};

export default API;
