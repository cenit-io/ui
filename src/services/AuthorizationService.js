import { of } from "rxjs";
import { map } from "rxjs/operators";

import session from "../util/session";
import localStorage from "../util/localStorage";
import { request, authorize } from "../util/request";

const appIdentifier = process.env.REACT_APP_APP_ID || 'admin';

export { authorize, authWithAuthCode, apiRequest } from "../util/request";

export const clearSession = () => session.clear();

export const getAccess = () => {
  const access = session.get('accessToken');

  if (!access) authorize();

  return of(access);
}

export const getAccessToken = () => getAccess().pipe(map(access => (access && access.access_token) || null));

export const getIdToken = () => {
  let idToken = session.get('idToken');

  if (idToken) return of(idToken);

  return getAccess().pipe(
    map(access => {
      if (access) {
        const base64 = access.id_token.split('.')[1].replace('-', '+').replace('_', '/');
        idToken = JSON.parse(window.atob(base64));
        session.set('idToken', idToken);
      }

      return idToken;
    })
  );
}

export const logout = () => {
  localStorage.clear();
  session.clear();
  window.location = `${session.cenitBackendBaseUrl}/users/sign_out`;
}

export const appRequest = (options) => {
  options.url = `/app/${appIdentifier}/${options.url}`;
  return request(options);
}

export const updateConfig = (data = {}) => {
  return appRequest({ url: 'config', method: 'POST', data }).pipe(
    map((response) => response.data)
  );
}

// TODO: Set config in local storage.
// export const updateConfig = (data = {}) => {
//   let config = localStorage.get('config', {});
//
//   config = deepMergeObjectsOnly(config, data);
//   localStorage.set('config', config);
//
//   return of(config);
// }