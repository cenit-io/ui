import React, { useEffect, useState } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import { Subject } from "rxjs";

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative'
    },
    mainContainer: {
        position: 'relative',
        display: 'flex',
        height: `calc(100vh - ${appBarHeight(theme)})`,
        marginTop: appBarHeight(theme)
    },
    contentMargin: {
        marginLeft: theme.spacing(7) + 1
    }
}));

const Main = () => {
    const [docked, setDocked] = useState(localStorage.getItem('docked') !== 'false');
    const [idToken, setIdToken] = useState(null);
    const [config, setConfig] = useState(null);
    const [resolvedConfig, setResolvedConfig] = useState(null);
    const [dataTypeSubject] = useState(new Subject());
    const [tabItemSubject] = useState(new Subject());

    const classes = useStyles();

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    useEffect(() => {
        if (!idToken) {
            const subscription = AuthorizationService.getIdToken().subscribe(
                token => setIdToken(token)
            );

            return () => subscription.unsubscribe();
        }
    }, [idToken]);

    useEffect(() => {
        if (config) {
            const tenant_id = config.tenant_id || (resolvedConfig && resolvedConfig.tenant_id);
            if (tenant_id) {
                const subscription = AuthorizationService.config({ tenant_id, ...config }).subscribe(
                    config => setResolvedConfig(config)
                );
                return () => subscription.unsubscribe();
            } else {
                setResolvedConfig(null);
            }
        }
    }, [config]);

    const { tenant_id } = resolvedConfig || {};

    const updateConfig = partialConfig => setConfig(partialConfig);

    const navigation = <Navigation key={tenant_id}
                                   docked={docked}
                                   setDocked={setDocked}
                                   xs={xs}
                                   config={resolvedConfig}
                                   dataTypeSubject={dataTypeSubject}
                                   tabItemSubject={tabItemSubject}
                                   updateConfig={updateConfig}/>;

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    function handleTenantSelected(tenant) {
        if (!config || tenant.id !== config.tenant_id) {
            setConfig({ tenant_id: tenant.id })
        }
    }

    const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `${theme.spacing(7) + 1}px`);
    const tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

    return <div className={classes.root}>
        <div className={classes.mainContainer}>
            <div className={clsx(!(xs || docked) && classes.contentMargin)}
                 style={{
                     flexGrow: 1,
                     order: 1,
                     width: `calc(${tabsWidth})`
                 }}>
                <Tabs docked={docked}
                      config={resolvedConfig}
                      tabItemSubject={tabItemSubject}
                      width={tabsWidth}
                      updateConfig={updateConfig}/>
            </div>
            {
                xs || navigation
            }
            {
                xs &&
                <Drawer docked={docked}
                        onClose={switchNavigation}
                        idToken={idToken}
                        navigation={navigation}/>
            }
        </div>
        <AppBar onToggle={switchNavigation}
                onTenantSelected={handleTenantSelected}
                dataTypeSelectorDisabled={resolvedConfig === null}
                dataTypeSubject={dataTypeSubject}
                idToken={idToken}/>
    </div>
};

export default Main;
