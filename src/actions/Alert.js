import React from "react";
import clsx from "clsx";
import DefaultMainIcon from "@material-ui/icons/LinkOff";
import DefaultSmallIcon from "@material-ui/icons/Cancel";
import Typography from "@material-ui/core/Typography";
import { makeStyles, useTheme } from "@material-ui/core";
import ResponsiveContainer from "../components/ResponsiveContainer";

const alertStyles = makeStyles(theme => ({
  okBox: {
    width: '100px',
    minHeight: '100px',
    borderRadius: '50%',
    position: 'relative',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    justifyContent: 'center'
  },
  okIcon: {
    position: 'absolute',
    top: '8px',
    right: 0,
    background: theme.palette.background.paper,
    borderRadius: '50%'
  },
  fullHeight: {
    height: '100%'
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  actionButton: {
    margin: theme.spacing(1)
  },
  okContainer: {
    overflow: 'auto',
    background: theme.palette.background.default,
    padding: theme.spacing(3)
  },
  alignCenter: {
    textAlign: 'center'
  },
  padding: {
    padding: theme.spacing(1),
    width: `calc(100% - ${theme.spacing(6)}px)`
  }
}));

const DefaultIconColor = [
  'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
].reduce((hash, color) => (hash[color] = true) && hash, {});

export default function Alert(
  { title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background }
) {
  const classes = alertStyles();
  const theme = useTheme();

  const MainIcon = mainIcon || DefaultMainIcon;
  const SmallIcon = smallIcon || DefaultSmallIcon;

  background = background || theme.palette.error.light;

  smallIconColor = smallIconColor || 'error';

  mainIconColor = DefaultIconColor[mainIconColor]
    ? { color: mainIconColor }
    : { style: { color: mainIconColor } };

  smallIconColor = DefaultIconColor[smallIconColor]
    ? { color: smallIconColor }
    : { style: { color: smallIconColor } };

  return <ResponsiveContainer>
    <div key='successAlert' className={clsx(classes.fullHeight, classes.center, classes.okContainer)}>
      <div className={clsx(classes.okBox, classes.center)} style={{ background }}>
        <SmallIcon className={classes.okIcon} {...smallIconColor} />
        <MainIcon fontSize='large' {...mainIconColor} />
      </div>
      <Typography variant='h5' className="flex align-items-center">
        {title}
      </Typography>
      <Typography variant='subtitle1' className={classes.alignCenter}>
        {message}
      </Typography>
      <div className={clsx(classes.alignCenter, classes.padding)}>
        {children}
      </div>
    </div>
  </ResponsiveContainer>;
}
