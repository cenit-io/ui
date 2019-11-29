import React, { useState } from 'react';
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

const Navigation = ({ docked, xs, config, onItemSelected }) => {

    const [over, setOver] = useState(false),

        classes = useStyles(),

        select = dataType => () => onItemSelected({ [DataTypeId]: dataType.id });

    let nav;

    if (config) {
        nav = (config.dataTypes || []).filter(dt => dt).map(
            (dataType, index) => {
                const title = config.titles[index];
                return <ListItem button key={dataType.id} onClick={select(dataType)}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                    <ListItemText primary={title}/>
                </ListItem>;
            }
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
