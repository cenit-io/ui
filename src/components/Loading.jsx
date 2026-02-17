import React from 'react';
import { CircularProgress } from "@mui/material";
import clsx from "clsx";
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));
export default function ({ height, className }) {
  const classes = useStyles();

  const style = height ? { height } : null;

  return <div className={clsx(classes.root, className)} style={style}>
    <CircularProgress />
  </div>
}
