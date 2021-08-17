import React, { useEffect } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import useTheme from "@material-ui/core/styles/useTheme";
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import ConfigService from "../services/ConfigService";
import Subjects, { NavSubject } from "../services/subjects";
import { delay } from "rxjs/operators";
import MainContext, { useMainContext } from "./MainContext";
import TenantContext from "./TenantContext";
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import { AppGateway } from "../services/AuthorizationService";
import { DataType } from "../services/DataTypeService";
import { from } from "rxjs";

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
        marginLeft: theme.spacing(10) + 5,
    },
    drop: {
        position: 'absolute',
        opacity: 0.5,
        zIndex: 1100, top: 0,
        left: 0,
        background: '#ffffff'
    }
}));

function MainLayout() {
    const [mainContextState, setMainContextState] = useMainContext();

    const classes = useStyles();

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    const { docked } = mainContextState;
    const setDocked = docked => setMainContextState({ docked });

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

    const switchNavigation = () => {
        localStorage.setItem('docked', String(!docked));
        setDocked(!docked);
    };

    let navigationUI = <Navigation key={navKey}
                                   xs={xs}
                                   onToggle={switchNavigation}/>;

    if (xs) {
        navigationUI = (
            <Drawer onClose={switchNavigation}>
                {navigationUI}
            </Drawer>
        );
    }

    const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `${theme.spacing(10) + 5}px`);
    const tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

    return (
        <div className={classes.root}>
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
            <AppBar onToggle={switchNavigation}/>
        </div>
    );
}

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#447797'
        },
        secondary: {
            main: '#447797'
        }
    },
});

export default function Main() {
    return (
        <ThemeProvider theme={theme}>
            <MainContext>
                <TenantContext>
                    <MainLayout/>
                </TenantContext>
            </MainContext>
        </ThemeProvider>
    )
}
