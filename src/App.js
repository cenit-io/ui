import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import AuthorizationService, { CenitHostKey, Config } from "./services/AuthorizationService";
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

API.onError(() => AuthorizationService.authorize());

function reset() {
  AuthorizationService.cleanAccess();
  AuthorizationService.cleanHost();
  AuthorizationService.authorize();
}

function App() {

  const [authorizing, setAuthorizing] = useState(true);
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
  }, []);

  useEffect(() => {
    if (authorizing) {
      const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

      if (params.cenitHost) {
        sessionStorage.setItem(CenitHostKey, params.cenitHost);
      }

      let authorize;
      if (params.code) {
        authorize = AuthorizationService.getAccessWith(params);
      } else {
        authorize = AuthorizationService.getAccess();
      }

      const subscription = authorize.pipe(
        tap(access => {
          if (!access) {
            throw new Error('Auth with no access shoud not happens');
          }
        })
      ).subscribe(
        () => setAuthorizing(false),
        e => console.error(e)
      );

      return () => subscription.unsubscribe();
    }
  }, [authorizing]);

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
            Connection refused from <a href={Config.getCenitHost()} target="_blank">
            {Config.getCenitHost()} </a>
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
