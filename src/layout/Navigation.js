import React, { useEffect, useReducer, useState } from 'react';
import clsx from 'clsx';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import HistoryIcon from '@material-ui/icons/History';
import { makeStyles, useTheme } from "@material-ui/core";
import Loading from "../components/Loading";
import { DataTypeId } from "../common/Symbols";
import zzip from "../util/zzip";
import { of } from "rxjs";
import { map, switchMap, delay } from "rxjs/operators";
import { DataType } from "../services/DataTypeService";
import Skeleton from "@material-ui/lab/Skeleton";
import ConfigService from "../services/ConfigService";
import reducer from "../common/reducer";
import Subjects, { NavSubject, TabsSubject } from "../services/subjects";
import Collapse from "@material-ui/core/Collapse";

function NavItem({ subject, onClick }) {
    const [title, setTitle] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        const subscription = subject.quickTitle().subscribe(
            title => setTitle(title)
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const subscription = subject.title().subscribe(
            title => setTitle(title)
        );
        return () => subscription.unsubscribe();
    }, [subject]);

    let text;
    let icon;
    if (title) {
        icon = subject.navIcon();
        text = title;
    } else {
        icon = <Skeleton variant="circle"
                         width={theme.spacing(3)}
                         height={theme.spacing(3)}/>;
        text = <Skeleton variante="text"/>;
    }

    return (
        <ListItem button
                  disabled={!title}
                  onClick={onClick}>
            <ListItemIcon>
                {icon}
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

const Navigation = ({ docked, setDocked, xs }) => {
    const [state, setState] = useReducer(reducer, {
        navigation: ConfigService.state().navigation || [],
        history: true
    });
    const classes = useStyles();
    const theme = useTheme();

    const { navigation, disabled, over, history } = state;

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

    useEffect(() => {
        const subscription = ConfigService.navigationChanges().subscribe(
            navigation => setState({
                navigation: navigation || [],
                disabled: true
            })
        );
        return () => subscription.unsubscribe();
    }, []);

    const setOver = over => setState({ over });

    const select = key => () => {
        if (xs) {
            setDocked(false);
        }
        TabsSubject.next(key);
    };

    let nav;
    if (navigation) {
        nav = navigation.map(
            ({ key }) => <NavItem key={key} subject={Subjects[key]} onClick={select(key)}/>
        );
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
