import React, {useState} from 'react';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';

const Navigation = ({ docked }) => {

    const [over, setOver] = useState(false);

    return <div style={{
        border: 'solid 2px darkgreen',
        position: docked ? 'static' : 'absolute',
        background: 'white',
        order: 0,
        height: docked ? 'unset' : '100%'
    }}
                onMouseEnter={() => setOver(true)}
                onMouseLeave={() => setOver(false)}>
        <List>
            {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                <ListItem button key={text}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                    {(over || docked) && <ListItemText primary={text}/>}
                </ListItem>
            ))}
        </List>
        <Divider/>
        <List>
            {['All mail', 'Trash', 'Spam'].map((text, index) => (
                <ListItem button key={text}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}</ListItemIcon>
                    {(over || docked) && <ListItemText primary={text}/>}
                </ListItem>
            ))}
        </List>
    </div>
};

export default Navigation;