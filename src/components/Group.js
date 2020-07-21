import React, { useState } from 'react';
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";
import Button from "@material-ui/core/Button";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles(theme => ({
    header: {
        padding: theme.spacing(0, 1)
    },
    title: {
        textAlign: 'left',
        flexGrow: 1,
        textTransform: 'capitalize',
    }
}));

const HeaderButton = withStyles({
    root: {
        display: 'flex',
        width: '100%'
    }
})(Button);

export default function ({ name, children }) {
    const [collapsed, setCollapsed] = useState(false);

    const classes = useStyles();

    const switchCollapsed = () => setCollapsed(!collapsed);

    const Icon = collapsed ? ExpandLess : ExpandMore;
    return (
        <div className="flex column">
            <div className={classes.header}>
                <HeaderButton onClick={switchCollapsed}>
                    <Typography variant="h5" className={classes.title}>
                        {name}
                    </Typography>
                    <Icon size="large"/>
                </HeaderButton>
            </div>
            <Collapse in={collapsed}>
                {children}
            </Collapse>
        </div>
    );
}
