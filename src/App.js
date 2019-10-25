import React from 'react';
import QueryString from 'querystring';
import AuthorizationService from "./services/AuthorizationService";
import {CircularProgress} from "@material-ui/core";
import Main from "./layout/Main";
import API from "./services/ApiService";
import ErrorBoundary from "./components/ErrorBoundary";
import './components/ContentCentered.css';

API.onError(e => AuthorizationService.authorize());

class App extends React.Component {

    state = { authorizing: true };

    componentDidMount() {

        API.onError(e => this.setState({ error: true }));

        const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

        let authorize;
        if (params.code) {
            authorize = AuthorizationService.getAccessWith(params);
        } else {
            authorize = AuthorizationService.getAccess();
        }
        authorize.then(
            access => access && this.setState({ authorizing: false })
        ).catch(() => this.setState({ error: true }));
    }

    render() {
        const { authorizing, error } = this.state;

        if (error) {
            return <ErrorBoundary/>
        }

        if (authorizing) {
            return <div className='content-centered'>
                <CircularProgress/>
            </div>;
        }

        return <ErrorBoundary>
            <Main/>
        </ErrorBoundary>;
    }
}

export default App;
