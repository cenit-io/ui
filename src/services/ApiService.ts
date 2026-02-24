import axios, { AxiosRequestConfig, CancelToken, ResponseType } from 'axios';
import { apiRequest } from './AuthorizationService';
import { catchError } from "rxjs/operators";
import { from, of, throwError, Observable } from "rxjs";
import session from "../util/session";

export interface ApiResourceConfig extends AxiosRequestConfig {
  onUploadProgress?: (progressEvent: any) => void;
  cancelToken?: CancelToken;
  responseType?: ResponseType;
}

export const ApiResource = function (this: any, ...args: any[]) {
  let params = args[args.length - 1];
  let headers: any;
  let size: number;
  let onUploadProgress: any;
  let cancelToken: any;
  let responseType: any;

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

  const config: ApiResourceConfig = {
    headers,
    params,
    onUploadProgress,
    cancelToken,
    responseType
  };

  this.path = args.join('/');

  this.get = () => from(apiRequest({ url: this.path, method: 'GET', ...config }));

  this.delete = () => from(apiRequest({ url: this.path, method: 'DELETE', ...config }));

  this.post = (data: any) => from(apiRequest({ url: this.path, method: 'POST', data, ...config }));
} as any as { new(...args: any[]): any };

const ErrorCallbacks: ((error: any) => void)[] = [];

const ConnectionRefusedCallbacks: ((error: any) => void)[] = [];

const API = {
  get: (...args: any[]): Observable<any> => {
    return (new ApiResource(...args)).get().pipe(
      catchError((e: any) => {
        if (axios.isCancel(e)) {
          throw e;
        }
        if (e.response) {
          if (e.response.status === 422) {
            return throwError(e);
          }
          if (e.response.status !== 404 && e.response.status !== 403) {
            ErrorCallbacks.forEach(callback => callback(e));
          }
        } else {
          ConnectionRefusedCallbacks.forEach(callback => callback(e));
        }
        return of(null);
      })
    )
  },

  post: (...args: any[]): Observable<any> => {
    const data = args.pop();
    return (new ApiResource(...args)).post(data).pipe(
      catchError((e: any) => {
        if (e.response) {
          switch (e.response.status) {
            case 404:
              break;
            case 403:
            case 422:
              throw e;
            default:
              ErrorCallbacks.forEach(callback => callback(e));
          }
          return of(null);
        } else {
          ConnectionRefusedCallbacks.forEach(callback => callback(e));
        }
        throw e;
      })
    );
  },

  delete: (...args: any[]): Observable<any> => {
    return (new ApiResource(...args)).delete().pipe(
      catchError((e: any) => {
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
        } else {
          ConnectionRefusedCallbacks.forEach(callback => callback(e));
        }
        throw e;
      })
    );
  },

  onError: (callback: (error: any) => void) => ErrorCallbacks.push(callback),

  onConnectionRefused: (callback: (error: any) => void) => ConnectionRefusedCallbacks.push(callback),

  setupOAuth2Credentials: (): Promise<[string, string]> => {
    const url = `${session.cenitBackendBaseUrl}/app/admin/oauth2/client/credentials`;
    const reverse = (str: string) => str.split('').reverse().join('');

    return axios.get(url).then(({ data: { client_token } }) => {
      const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = JSON.parse(window.atob(reverse(client_token)));

      session.set('OAUTH_CLIENT_ID', OAUTH_CLIENT_ID);
      session.set('OAUTH_CLIENT_SECRET', OAUTH_CLIENT_SECRET);

      return [OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET];
    });
  }
};

export default API;
