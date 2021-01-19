import React, { useContext, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import API from "../services/ApiService";
import FrezzerLoader from "../components/FrezzerLoader";
import { eq } from "../services/BLoC";
import ConfigService from "../services/ConfigService";
import makeStyles from "@material-ui/core/styles/makeStyles";

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
        loading: true
    });

    const classes = useLoaderStyles();

    const { tenant, switchingTenant, loading } = state;

    const setSwitchingTenant = switchingTenant => setState({ switchingTenant });

    useEffect(() => {
        const subscription = API.get('setup', 'user', 'me').subscribe(
            user => {
                if (user) {
                    setState({
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
        <TC.Provider value={[tenant, setSwitchingTenant, loading]}>
            {tenant && children}
            {loading && <FrezzerLoader backdropClass={classes.backdrop}/>}
        </TC.Provider>
    );
}
