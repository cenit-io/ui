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
    const [currentConfig, setCurrentConfig] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dataTypeSubject] = useState(new Subject());

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
            if (currentConfig && currentConfig.tenant_id !== config.tenant_id) {
                setItems([]);
                setCurrentConfig(null);
            }
            if (config.tenant_id) {
                const subscription = AuthorizationService.config(config).subscribe(
                    config => setCurrentConfig(config)
                );
                return () => subscription.unsubscribe();
            }
        }
    }, [config]);

    const { tenant_id } = currentConfig || {};

    const updateConfig = partialConfig => setConfig({ tenant_id, ...currentConfig, ...partialConfig });

    const navigation = <Navigation key={tenant_id}
                                   docked={docked}
                                   xs={xs}
                                   config={currentConfig}
                                   dataTypeSubject={dataTypeSubject}
                                   onItemSelected={handleItemSelected}
                                   updateConfig={updateConfig}/>;

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    function handleItemSelected(item) {
        if (xs && docked) {
            switchNavigation();
        }
        let index = items.findIndex(
            value => !Object.keys(item).find(
                key => value[key] !== item[key]
            ) && !Object.getOwnPropertySymbols(item).find(
                key => value[key] !== item[key]
            )
        );
        if (index === -1) {
            index = items.length;
            setItems([...items, item]);
        }
        setSelectedIndex(index);
    }

    function removeItem(index) {
        if (selectedIndex === items.length - 1) {
            setSelectedIndex(selectedIndex - 1);
        }
        let newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

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
                      items={items}
                      index={selectedIndex}
                      onSelect={setSelectedIndex}
                      onCloseItem={removeItem}
                      onItemPickup={handleItemSelected}
                      width={tabsWidth}/>
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
                dataTypeSelectorDisabled={currentConfig === null}
                dataTypeSubject={dataTypeSubject}
                idToken={idToken}/>
    </div>
};

export default Main;
