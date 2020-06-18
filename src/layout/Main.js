import React, { useEffect, useReducer, useState } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import reducer from "../common/reducer";
import ConfigService from "../services/ConfigService";
import Loading from "../components/Loading";
import { DataTypeSubject, TabsSubject } from "../services/subjects";

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
    },
    drop: {
        position: 'absolute',
        opacity: 0.5,
        zIndex: 1100, top: 0,
        left: 0,
        background: '#ffffff'
    }
}));

const Main = () => {
    const [state, setState] = useReducer(reducer, {
        docked: localStorage.getItem('docked') !== 'false',
        disabled: ConfigService.isDisabled()
    });

    const classes = useStyles();

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    const { idToken, docked, disabled } = state;

    const setDocked = docked => setState({ docked });

    useEffect(() => {
        const subscription = ConfigService.onDisabled().subscribe(
            disabled => setState({ disabled })
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = AuthorizationService.getIdToken().subscribe(
            idToken => setState({ idToken })
        );

        return () => subscription.unsubscribe();
    }, []);

    let navKey;
    if (xs) {
        navKey = `nav_${ConfigService.state().tenant_id}`;
    }
    const navigationUI = <Navigation key={navKey}
                                     docked={docked}
                                     setDocked={setDocked}
                                     xs={xs}/>;

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `${theme.spacing(7) + 1}px`);
    const tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

    let drop;
    if (disabled) {
        drop = <Loading className={classes.drop}/>;
    }

    return <div className={classes.root}>
        <div className={classes.mainContainer}>
            <div className={clsx(!(xs || docked) && classes.contentMargin)}
                 style={{
                     flexGrow: 1,
                     order: 1,
                     width: `calc(${tabsWidth})`
                 }}>
                <Tabs docked={docked}
                      width={tabsWidth}/>
            </div>
            {
                xs || navigationUI
            }
            {
                xs &&
                <Drawer docked={docked}
                        onClose={switchNavigation}
                        idToken={idToken}>
                    {navigationUI}
                </Drawer>
            }
        </div>
        <AppBar onToggle={switchNavigation}
                disabled={disabled}
                idToken={idToken}/>
        {drop}
    </div>
};

export default Main;
