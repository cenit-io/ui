import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import AuthorizationService from "./services/AuthorizationService";
import { CircularProgress } from "@material-ui/core";
import Main from "./layout/Main";
import API from "./services/ApiService";
import ErrorBoundary from "./components/ErrorBoundary";
import { catchError } from "rxjs/operators";
import { of } from "rxjs";
import './common/FlexBox.css';

API.onError(e => AuthorizationService.authorize());

function App() {

    const [authorizing, setAuthorizing] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (authorizing) {
            API.onError(e => setError(true));

            const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

            let authorize;
            if (params.code) {
                authorize = AuthorizationService.getAccessWith(params);
            } else {
                authorize = AuthorizationService.getAccess();
            }

            const subscription = authorize.pipe(
                catchError(error => {
                    setError(true);
                    return of(null);
                })
            ).subscribe(
                access => access && setAuthorizing(false)
            );

            return () => subscription.unsubscribe();
        }
    }, [authorizing]);


    if (error) {
        return <ErrorBoundary/>
    }

    if (authorizing) {
        return <div className='flex full-width full-v-height justify-content-center align-items-center'>
            <CircularProgress/>
        </div>;
    }

    return <ErrorBoundary>
        <Main/>
    </ErrorBoundary>;
}

export default App;
