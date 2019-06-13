import React, {useState} from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import {CircularProgress} from "@material-ui/core";

const Navigation = ({ docked, config }) => {

    const [over, setOver] = useState(false);

    let nav;

    if (config) {
        nav = (config.dataTypesIds || []).map(
            (id, index) => <ListItem button key={id}>
                <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                {(over || docked) && <ListItemText primary={id}/>}
            </ListItem>
        );
        nav = <List> {nav} </List>;
    } else {
        nav = <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <CircularProgress/>
        </div>
    }

    return <div style={{
        border: 'solid 2px darkgreen',
        position: docked ? 'static' : 'absolute',
        background: 'white',
        order: 0,
        height: '100%'
    }}
                onMouseEnter={() => setOver(true)}
                onMouseLeave={() => setOver(false)}>
        {nav}
    </div>
};

export default Navigation;