import React from 'react';
import AppBar from './layout/AppBar';
import QueryString from 'querystring';
import AuthorizationService from "./services/AuthorizationService";
import {CircularProgress} from "@material-ui/core";
import FormTest from "./components/FormTest";


class App extends React.Component {

    value = {
        name: 'Mac',
        checked: true,
        ref_b: { "id": "5ceca28c6ecd7911b900000f" },
        many_ref_bs: [
            { "id": "5ceca28c6ecd7911b900000f" },
            { "id": "5ceca28c6ecd7911b900000f" }
        ],
        many_embedded_bs: [
            { color: 'red' },
            { color: 'blue' }
        ]
    };

    state = { authorizing: true };

    componentDidMount() {
        const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

        let authorize;
        if (params.code) {
            authorize = AuthorizationService.getAccessWith(params);
        } else {
            authorize = AuthorizationService.getAccess();
        }
        authorize.then(access => access && this.setState({ authorizing: false }));
    }

    render() {
        const { authorizing } = this.state;

        if (authorizing) return <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <CircularProgress/>
        </div>;

        return <div>
            <AppBar/>
            <FormTest/>
        </div>;
    }
}

export default App;