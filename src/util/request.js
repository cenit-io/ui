import { from } from "rxjs";
import { Status } from "../common/Symbols";
import {
  authorize as _authorize,
  authWithAuthCode as _authWithAuthCode,
  request as _request,
  apiRequest as _apiRequest,
} from "cenit-frontend-sdk/request";

export const authorize = () => {
  const scope = 'openid profile email offline_access session_access multi_tenant create read update delete digest';
  return _authorize(scope);
}

export const authWithAuthCode = (authCode) => from(_authWithAuthCode(authCode));

export const request = (options) => from(_request(options));

export const apiRequest = (options) => {
  return _apiRequest(options).then(({ data, status }) => {
    if (data?.constructor === Object) data[Status] = status;
    return data;
  });
}

export default request;