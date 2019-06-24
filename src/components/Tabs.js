import React, {useState} from 'react';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Clear';
import Typography from '@material-ui/core/Typography';
import FormTest from "./FormTest";
import SwipeableViews from "react-swipeable-views";

function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

function ItemTab({ item, index, onSelect, onClose }) {

    const [data, setData] = useState({});

    if (data.item !== item) {
        item.getTitle().then(title => setData({ item, title }));
    }
    return (
        <Tab
            component={ClosableComponent}
            onClick={() => onSelect(index)}
            label={data.title}
            onClose={() => onClose(index)}
        />
    );
}

class ClosableComponent extends React.Component {

    state = {};

    setOver = over => () => this.setState({ over });

    render() {
        const { onClick, children, onClose } = this.props,

            { over } = this.state;

        return <div onMouseEnter={this.setOver(true)} onMouseLeave={this.setOver(false)}>
            <Button onClick={onClick}>{children}</Button>

            <IconButton aria-label="Close" size="small"
                        style={{ visibility: over ? 'visible' : 'hidden' }}
                        onClick={onClose}>
                <CloseIcon fontSize="inherit"/>
            </IconButton>
        </div>;
    }
}

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        position: 'relative'
    },
}));

export default function NavTabs({ items, index, onSelect, onCloseItem }) {
    const classes = useStyles(),

        theme = useTheme(),

        [value, setValue] = React.useState(0),

        tabs = items.map((item, i) => <ItemTab key={`tab_${item.id}`}
                                               item={item}
                                               index={i}
                                               onSelect={onSelect}
                                               onClose={onCloseItem}/>),

        containers = items.map(
            item => <div key={`container_${item.id}`}
                         style={{ overflow: 'auto' }}>
                <FormTest item={item}/>
            </div>);


    function handleChange(event, newValue) {
        setValue(newValue);
    }

    return (
        <div className={classes.root}>
            <AppBar position="sticky" color="default">
                <Tabs value={index}
                      onChange={handleChange}
                      variant="scrollable"
                      scrollButtons="on"
                      indicatorColor="primary"
                      style={{ minHeight: 'inherit' }}>
                    {tabs}
                </Tabs>
            </AppBar>
            <SwipeableViews axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                            index={index}>
                {containers}
            </SwipeableViews>
        </div>
    );
}
