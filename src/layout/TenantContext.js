import React, { useContext, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import API from "../services/ApiService";
import FrezzerLoader from "../components/FrezzerLoader";
import ConfigService from "../services/ConfigService";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { Status } from "../common/Symbols";
import EmbeddedAppService from "../services/EnbeddedAppService";
import { defer, of, zip } from "rxjs";
import { catchError } from "rxjs/operators";
import AuthorizationService from "../services/AuthorizationService";

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

  const { tenant, loading, switchSudo } = state;

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
    let subscription;
    setState({ loading: true });
    if (tenant) {
      subscription = API.get('setup', 'account', tenant.id).pipe(
        catchError(() => of(null))
      ).subscribe(remote => {
        if (remote?.id !== tenant.id) {
          remote = tenant;
        }
        AuthorizationService.setXTenantId(tenant.id);
        setState({ tenant: remote, loading: false });
        ConfigService.update({ tenant_id: remote.id });
        EmbeddedAppService.refreshAll();
      });
    } else {
      subscription = zip(
        API.get('setup', 'user', 'me'),
        defer(() => {
          const tenantId = AuthorizationService.getXTenantId();
          if (tenantId) {
            return API.get('setup', 'account', tenantId);
          }

          return of(null);
        })
      ).subscribe(([user, tenant]) => {
          if (user) {
            tenant = tenant || user.account
            setState({
              user, tenant, loading: false
            });
            AuthorizationService.setXTenantId(tenant.id);
            ConfigService.update({ tenant_id: tenant.id });
            EmbeddedAppService.refreshAll();
          }
        }
      );
    }
    return () => subscription.unsubscribe();
  }, [tenant?.id]);

  return (
    <TC.Provider value={[state, setState]}>
      {tenant && children}
      {loading && <FrezzerLoader backdropClass={classes.backdrop} />}
    </TC.Provider>
  );
}

export function isSuperAdmin(user) {
  return user?.super_admin_enabled &&
    !!(user.roles || []).find(({ name }) => name === "super_admin");
}
