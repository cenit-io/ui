import React, { useState } from 'react';
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";
import Button from "@material-ui/core/Button";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
  header: {
    padding: theme.spacing(1, 1, 1, 0)
  },
  title: {
    textAlign: 'left',
    flexGrow: 1,
    textTransform: 'capitalize',
  },
  error: {
    color: theme.palette.error.main
  },
  icon: {
    margin: theme.spacing(0, 4, 0, 1),
    display: 'flex',
    alignItems: 'center'
  }
}));

const HeaderButton = withStyles({
  root: {
    display: 'flex',
    width: '100%'
  }
})(Button);
export default function Collapsible({ title, children, error, variant, defaultCollapsed, icon }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed === undefined ? true : Boolean(defaultCollapsed));

  const classes = useStyles();

  const switchCollapsed = () => setCollapsed(!collapsed);

  const Icon = collapsed ? ExpandMore : ExpandLess;

  const errorClass = error && classes.error;

  if (icon) {
    icon = (
      <div className={classes.icon}>
        {icon}
      </div>
    );
  }

  return (
    <div className="flex column">
      <div className={classes.header}>
        <HeaderButton onClick={switchCollapsed}>
          {icon}
          <Typography variant={variant || 'h6'} className={clsx(classes.title, errorClass)}>
            {title}
          </Typography>
          <Icon size="large" className={clsx(errorClass)} />
        </HeaderButton>
      </div>
      <Collapse in={!collapsed}>
        {children}
      </Collapse>
    </div>
  );
}
