import React, { useContext, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import API from "../services/ApiService";
import FrezzerLoader from "../components/FrezzerLoader";
import { eq } from "../services/BLoC";
import ConfigService from "../services/ConfigService";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { Status } from "../common/Symbols";

const TC = React.createContext({});


export function useTenantContext() {
    return useContext(TC);
}

const useLoaderStyles = makeStyles(() => ({
    backdrop: {
        background: 'transparent'
    }
}));

export default function TenantContext({ children }) {
    const [state, setState] = useSpreadState({
        loading: true,
        switchSudo: false
    });

    const classes = useLoaderStyles();

    const { tenant, switchingTenant, loading, switchSudo } = state;

    useEffect(() => {
        if (switchSudo) {
            setState({ loading: true });
            const subscription = API.get('setup', 'user', 'me', 'digest', 'switch_sudo').subscribe(
                user => {
                    if (user[Status] === 200) {
                        setState({ user, switchSudo: false, loading: false });
                    } else {
                        setState({ switchSudo: false, loading: false })
                    }
                }
            );

            return () => subscription.unsubscribe();
        }
    }, [switchSudo]);

    useEffect(() => {
        const subscription = API.get('setup', 'user', 'me').subscribe(
            user => {
                if (user) {
                    setState({
                        user,
                        tenant: user.account,
                        switchingTenant: null,
                        loading: false
                    });
                    ConfigService.update({ tenant_id: user.account.id });
                }
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (switchingTenant && !eq(tenant, switchingTenant)) {
            setState({ loading: true });
            const subscription = API.post('setup', 'user', 'me', {
                account: {
                    id: switchingTenant.id
                }
            }).subscribe(() => {
                setState({
                    tenant: switchingTenant,
                    switchingTenant: null,
                    loading: false
                });
                ConfigService.update({ tenant_id: switchingTenant.id });
            });
            return () => subscription && subscription.unsubscribe();
        }
    }, [tenant, switchingTenant]);

    return (
        <TC.Provider value={[state, setState]}>
            {tenant && children}
            {loading && <FrezzerLoader backdropClass={classes.backdrop}/>}
        </TC.Provider>
    );
}
