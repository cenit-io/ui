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
import Subjects, { DataTypeSubject, TabsSubject } from "../services/subjects";
import Collapse from "@material-ui/core/Collapse";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import { useMainContext } from "./MainContext";
import Menu from "../config/Menu";
import { DataType } from "../services/DataTypeService";
import FrezzerLoader from "../components/FrezzerLoader";

function NavItem({ icon, onClick, disabled, text }) {
    return (
        <ListItem button
                  component="div"
                  disabled={disabled}
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

function NavSubject({ subject, onClick }) {
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
                            component="div"
                            width={theme.spacing(3)}
                            height={theme.spacing(3)}/>;
        text = <Skeleton variante="text" component="div"/>;
    }

    return (
        <NavItem icon={navIcon}
                 disabled={!title}
                 text={text}
                 onClick={onClick}/>
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

const useItemStyles = makeStyles(theme => ({
    root: {
        background: theme.palette.action.selected,
        padding: 0
    }
}));

function NavGroup({ title, IconComponent, items, open, onClick, onSelect }) {

    const itemClasses = useItemStyles();

    return (
        <>
            <NavItem text={title} icon={<IconComponent/>} onClick={onClick}/>
            <Collapse in={open}>
                <List className={itemClasses.root} component="ul">
                    {
                        items.map((item, index) => <NavItem key={`item_${index}`}
                                                            text={item.title}
                                                            icon={item.icon}
                                                            onClick={() => onSelect(item)}/>)
                    }
                </List>
            </Collapse>
        </>
    );
}

export default function Navigation({ xs }) {

    const [mainContextState, setMainContextState] = useMainContext();

    const { docked } = mainContextState;

    const [state, setState] = useSpreadState({
        navigation: ConfigService.state().navigation || [],
        history: true
    });

    const classes = useStyles();

    const itemClasses = useItemStyles();

    const { navigation, over, openIndex, item } = state;

    useEffect(() => {
        if (item) {
            const subscription = DataType.find(item.$ref).subscribe(
                dt => {
                    if (xs) {
                        setMainContextState({ docked: false });
                    }
                    if (dt) {
                        TabsSubject.next(DataTypeSubject.for(dt.id).key)
                    }
                    setState({ item: null });
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [item, xs]);

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

    const selectItem = item => setState({ item });

    let menuItems = Menu.groups.map((group, index) => (
        <NavGroup {...group}
                  key={`g_${index}`}
                  open={index === openIndex}
                  onClick={() => setState({ openIndex: index === openIndex ? -1 : index })}
                  onSelect={selectItem}/>
    ));

    let nav;
    if (navigation) {
        nav = navigation.map(
            ({ key }) => {
                const subject = Subjects[key];
                return subject && <NavSubject key={key} subject={Subjects[key]} onClick={select(key)}/>;
            }
        ).filter(item => item);
        nav = (
            <List style={{ overflowX: 'hidden' }} component="ul">
                <ListItem button
                          component="div"
                          onClick={() => setState({ openIndex: openIndex === 'recent' ? -1 : 'recent' })}>
                    <ListItemIcon>
                        <HistoryIcon component="svg"/>
                    </ListItemIcon>
                    <ListItemText>
                        Recent
                    </ListItemText>
                </ListItem>
                <Collapse in={openIndex === 'recent'}>
                    <List component="ul" classes={itemClasses}>
                        {nav}
                    </List>
                </Collapse>
                {menuItems}
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
        {item && <FrezzerLoader/>}
    </div>
}
