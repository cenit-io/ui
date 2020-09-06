import React, { useEffect, useReducer } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import AuthorizationService from "../services/AuthorizationService";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import spreadReducer from "../common/spreadReducer";
import ConfigService from "../services/ConfigService";
import Loading from "../components/Loading";
import Subjects, { NavSubject } from "../services/subjects";
import { delay } from "rxjs/operators";

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
    const [state, setState] = useReducer(spreadReducer, {
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

    useEffect(() => {
        const subscription = NavSubject.pipe(
            delay(3000)
        ).subscribe(
            key => {
                const sub = Subjects[key];
                if (sub) {
                    let navigation = [...(ConfigService.state().navigation || [])];
                    let notFound = true;
                    navigation.forEach(
                        e => {
                            if (e.key === key) {
                                notFound = false;
                                e.hits = (e.hits || 0) - navigation.length;
                            } else {
                                e.hits = (e.hits || 0) + 1;
                            }
                        }
                    );
                    if (notFound) {
                        const sort = [...navigation];
                        sort.sort((s1, s2) => (s1.hits || 0) - (s2.hits || 0));
                        sort.splice(10, navigation.length - 10);
                        navigation = navigation.filter(s => sort.find(({ key }) => key === s.key));
                        navigation.push({ key, hits: 0 });
                    }
                    ConfigService.update({ navigation });
                }
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    let navKey;
    if (xs) {
        navKey = `nav_${ConfigService.state().tenant_id}`;
    }
    let navigationUI = <Navigation key={navKey}
                                   docked={docked}
                                   setDocked={setDocked}
                                   xs={xs}/>;

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    if (xs) {
        navigationUI = (
            <Drawer docked={docked}
                    onClose={switchNavigation}
                    idToken={idToken}>
                {navigationUI}
            </Drawer>
        );
    }

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
                navigationUI
            }
        </div>
        <AppBar onToggle={switchNavigation}
                disabled={disabled}
                idToken={idToken}/>
        {drop}
    </div>
};

export default Main;
