import { from } from "rxjs";
import { Status } from "../common/Symbols";
import {
  authorize as _authorize,
  authWithAuthCode as _authWithAuthCode,
  request as _request,
  apiRequest as _apiRequest,
} from "cenit-frontend-sdk/request";

const OAUTH_SCOPE =
  'openid profile email offline_access session_access multi_tenant read update delete digest ' +
  'openid create {"namespace":"Setup","name":{"$in":["DataType","JsonDataType","Snippet","Template","LiquidTemplate","Flow","PlainWebhook","Collection","Application"]}}';

export const authorize = () => {
  return _authorize(OAUTH_SCOPE);
}

export const authWithAuthCode = (authCode: string) => from(_authWithAuthCode(authCode));

export const request = (options: any) => from(_request(options));

export const apiRequest = (options: any) => {
  return _apiRequest(options).then(({ data, status }: { data: any, status: number }) => {
    if (data?.constructor === Object) data[Status] = status;
    return data;
  });
}

export default request;
