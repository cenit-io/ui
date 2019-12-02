import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import { makeStyles } from "@material-ui/core";
import Loading from "../components/Loading";
import { DataTypeId } from "../common/Symbols";
import zzip from "../util/zzip";
import { of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { DataType } from "../services/DataTypeService";

export const navigationWidth = theme => `${theme.spacing(30)}px`;

const useStyles = makeStyles(theme => ({
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

const Navigation = ({ docked, xs, config, dataTypeSubject, tabItemSubject, updateConfig }) => {

    const [over, setOver] = useState(false);
    const [titles, setTitles] = useState({});
    const classes = useStyles();
    const navigation = config && config.navigation;

    useEffect(() => {
        const subscription = dataTypeSubject.subscribe(
            dataType => {
                if (!navigation || !navigation[dataType.id]) {
                    updateConfig({
                        navigation: {
                            ...navigation,
                            [dataType.id]: {}
                        }
                    });
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [dataTypeSubject]);

    useEffect(() => {
        if (navigation) {
            const subscription = zzip(
                ...Object.keys(navigation).map(id => {
                    if (titles[id]) {
                        return of({ id, title: titles[id] });
                    }
                    return DataType.getById(id).pipe(
                        switchMap(dataType => dataType.getTitle()),
                        map(title => ({ id, title }))
                    )
                })
            ).subscribe(
                titles => setTitles(
                    titles.reduce((prev, current) => ({ ...prev, [current.id]: current.title }), {})
                )
            );
            return () => subscription.unsubscribe();
        }
    }, [navigation]);

    const select = dataType => () => tabItemSubject.next({ [DataTypeId]: dataType.id });

    let nav;
    if (navigation) {
        nav = Object.keys(navigation).map(
            (id, index) => (
                <ListItem button
                          key={id}
                          onClick={select({ id })}
                          disabled={!titles.hasOwnProperty(id)}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                    <ListItemText primary={titles[id] || id}/>
                </ListItem>
            )
        );
        nav = <List style={{ overflowX: 'hidden' }}> {nav} </List>;
    } else {
        nav = <Loading/>;
    }

    const open = docked || over;

    return <div className={clsx(classes.drawer, { [classes.navOpen]: open, [classes.navClose]: !open })}
                style={{
                    position: docked ? 'static' : 'absolute',
                    background: 'white',
                    order: 0,
                    height: (docked && !xs) ? 'unset' : '100%',
                    boxShadow: '0 19px 38px rgba(0,0,0,0.30)',
                    zIndex: 1100
                }}
                onMouseEnter={() => setOver(true)}
                onMouseLeave={() => setOver(false)}>
        {nav}
    </div>
};

export default Navigation;
