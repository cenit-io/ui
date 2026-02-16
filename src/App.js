import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import { authorize, clearSession, authWithAuthCode, getAccess } from "./services/AuthorizationService";
import { CircularProgress } from "@material-ui/core";
import Main from "./layout/Main";
import API from "./services/ApiService";
import { tap } from "rxjs/operators";
import './common/FlexBox.css';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import Dialog from "@material-ui/core/Dialog";
import ExpiredIcon from "@material-ui/icons/HourglassEmpty";
import NetworkErrorIcon from "@material-ui/icons/WifiOff";
import AlertTitle from "@material-ui/lab/AlertTitle";
import { Alert } from "@material-ui/lab";
import Button from "@material-ui/core/Button";
import session from "./util/session";
import localStorage from "./util/localStorage";

API.onError(authorize);

function reset() {
  clearSession();
  authorize();
}

function App() {

  // 1) At startup, read the runtime config.js value into session.cenitBackendBaseUrl:
  if (window.appConfig && window.appConfig.REACT_APP_CENIT_HOST) {
    session.cenitBackendBaseUrl = window.appConfig.REACT_APP_CENIT_HOST;
  }

  const [authorizing, setAuthorizing] = useState(true);
  const [clientId, setClientId] = useState(session.clientId);
  const [error, setError] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    API.onError(() => {
      localStorage.clear();
      setError(true);
    });
    API.onConnectionRefused(() => {
      setNetworkError(true);
    });
    if (!clientId) API.setupOAuth2Credentials().then(([clientId]) => {
      setClientId(clientId);
    });
  }, []);

  useEffect(() => {
    if (authorizing && clientId) {
      const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

      if (params.cenitHost) {
        session.cenitBackendBaseUrl = params.cenitHost;
      }

      let authorize;
      if (params.code) {
        authorize = authWithAuthCode(params.code);
      } else {
        authorize = getAccess();
      }

      const subscription = authorize.pipe(
        tap(access => {
          if (!access) throw new Error('Auth with no access shoud not happens');
        })
      ).subscribe(
        () => setAuthorizing(false),
        e => console.error(e)
      );

      return () => subscription.unsubscribe();
    }
  }, [authorizing, clientId]);

  if (authorizing) {
    return <div className='flex full-width full-v-height justify-content-center align-items-center'>
      <CircularProgress />
    </div>;
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Main />
      <Dialog maxWidth="xs"
              open={error}>
        <Alert severity="error" icon={<ExpiredIcon component="svg" />}>
          <AlertTitle>
            <b>Session Expired</b>
          </AlertTitle>
          The app will reboot in a few seconds, reload manually if not.
        </Alert>
      </Dialog>
      <Dialog maxWidth="xs"
              open={networkError}>
        <Alert severity="error" icon={<NetworkErrorIcon component="svg" />}>
          <AlertTitle>
            <b>Unable to connect</b>
          </AlertTitle>
          <p>
            Connection refused from <a href={session.cenitBackendBaseUrl} target="_blank">
            {session.cenitBackendBaseUrl} </a>
          </p>
          <p>
            To reset and try again <Button href="#" onClick={reset} variant="outlined">
            Click here
          </Button>
          </p>
        </Alert>
      </Dialog>
    </MuiPickersUtilsProvider>
  );
}

export default App;
