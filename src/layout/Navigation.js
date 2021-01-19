import React, { useEffect } from 'react';
import clsx from 'clsx';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HistoryIcon from '@material-ui/icons/History';
import { makeStyles, useTheme } from "@material-ui/core";
import Loading from "../components/Loading";
import Skeleton from "@material-ui/lab/Skeleton";
import ConfigService from "../services/ConfigService";
import Subjects, { TabsSubject } from "../services/subjects";
import Collapse from "@material-ui/core/Collapse";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import { useMainContext } from "./MainContext";

function NavItem({ subject, onClick }) {
    const [state, setState] = useSpreadState();
    const theme = useTheme();

    const { icon, title } = state;

    useEffect(() => {
        const subscription = zzip(
            subject.navIcon(),
            subject.quickNavTitle()
        ).subscribe(
            ([icon, title]) => setState({ icon, title })
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = subject.navTitle().subscribe(
            title => setState({ title })
        );
        return () => subscription.unsubscribe();
    }, [subject]);

    let text;
    let navIcon;
    if (title) {
        navIcon = icon;
        text = title;
    } else {
        navIcon = <Skeleton variant="circle"
                            width={theme.spacing(3)}
                            height={theme.spacing(3)}/>;
        text = <Skeleton variante="text"/>;
    }

    return (
        <ListItem button
                  disabled={!title}
                  onClick={onClick}>
            <ListItemIcon>
                {navIcon}
            </ListItemIcon>
            <ListItemText>
                <div style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                }}>
                    {text}
                </div>
            </ListItemText>
        </ListItem>
    );
}

export const navigationWidth = theme => `${theme.spacing(30)}px`;

const useStyles = makeStyles(theme => ({
    drawer: {
        position: 'relative',
        boxShadow: '0 19px 38px rgba(0,0,0,0.30)',
        zIndex: 1100,
        overflow: 'auto',
        background: theme.palette.background.paper,
        order: 0,
    },
    navOpen: {
        width: navigationWidth(theme),
        transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    navClose: {
        transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowX: 'hidden',
        width: theme.spacing(7) + 1
    }
}));

const Navigation = ({ xs }) => {

    const [mainContextState, setMainContextState] = useMainContext();

    const { docked } = mainContextState;

    const [state, setState] = useSpreadState({
        navigation: ConfigService.state().navigation || [],
        history: true
    });
    const classes = useStyles();

    const { navigation, over, history } = state;

    useEffect(() => {
        const subscription = ConfigService.navigationChanges().subscribe(
            navigation => setTimeout(() =>
                setState({
                    navigation: navigation || [],
                    disabled: true
                })
            )
        );
        return () => subscription.unsubscribe();
    }, []);

    const setOver = over => setState({ over });

    const select = key => () => {
        if (xs) {
            setMainContextState({ docked: false });
        }
        TabsSubject.next(key);
    };

    let nav;
    if (navigation) {
        nav = navigation.map(
            ({ key }) => {
                const subject = Subjects[key];
                return subject && <NavItem key={key} subject={Subjects[key]} onClick={select(key)}/>;
            }
        ).filter(item => item);
        nav = (
            <List style={{ overflowX: 'hidden' }}>
                <ListItem button onClick={() => setState({ history: !history })}>
                    <ListItemIcon>
                        <HistoryIcon/>
                    </ListItemIcon>
                </ListItem>
                <Collapse in={history}>
                    <List>
                        {nav}
                    </List>
                </Collapse>
            </List>);
    } else {
        nav = <Loading/>;
    }

    const open = docked || over;


    return <div className={clsx(classes.drawer, { [classes.navOpen]: open, [classes.navClose]: !open })}
                style={{
                    position: docked ? 'static' : 'absolute',
                    height: (docked && !xs) ? 'unset' : '100%'
                }}
                onMouseEnter={() => setOver(true)}
                onMouseLeave={() => setOver(false)}>
        {nav}
    </div>
};

export default Navigation;
