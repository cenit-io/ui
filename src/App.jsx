import React, { useEffect, useState } from 'react';
import queryString from "query-string";
import { authorize, clearSession, authWithAuthCode, getAccess } from "./services/AuthorizationService";
import { CircularProgress } from "@mui/material";
import Main from "./layout/Main";
import API from "./services/ApiService";
import { tap } from "rxjs/operators";
import './common/FlexBox.css';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Dialog from "@mui/material/Dialog";
import ExpiredIcon from "@mui/icons-material/HourglassEmpty";
import NetworkErrorIcon from "@mui/icons-material/WifiOff";
import AlertTitle from '@mui/material/AlertTitle';
import { Alert } from '@mui/material';
import Button from "@mui/material/Button";
import session from "./util/session";
import localStorage from "./util/localStorage";
import { runtimeConfig } from "./config/runtimeConfig";

API.onError(authorize);

function reset() {
  clearSession();
  authorize();
}

function App() {

  // Runtime config precedence is window.appConfig -> import.meta.env -> defaults.
  session.cenitBackendBaseUrl = runtimeConfig.cenitHost;

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
      const params = queryString.parse(window.location.search);

      if (params.cenitHost) {
        session.cenitBackendBaseUrl = Array.isArray(params.cenitHost) ? params.cenitHost[0] : params.cenitHost;
      }

      let authorize;
      if (params.code) {
        authorize = authWithAuthCode(Array.isArray(params.code) ? params.code[0] : params.code);
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
    </LocalizationProvider>
  );
}

export default App;
