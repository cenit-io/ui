import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import { makeStyles, Typography } from "@material-ui/core";
import viewerComponentFor from "../viewers/viewerComponentFor";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
  root: {
    border: `solid 1px ${theme.palette.background.default}`
  },
  title: {
    minHeight: theme.spacing(7),
    background: theme.palette.background.default,
    borderTopLeftRadius: theme.spacing(.5),
    borderTopRightRadius: theme.spacing(.5),
    alignItems: 'center',
    padding: theme.spacing(0, 2)
  },
  content: {
    padding: theme.spacing(2)
  }
}));

export default function ViewerControl({ title, value, property, config }) {

  const [state, setState] = useSpreadState();

  const classes = useStyles();

  useEffect(() => {
    const subscription = value.parent.changed().subscribe(
      item => setState({ item })
    );
    return () => subscription.unsubscribe();
  }, [value]);

  const { item } = state;

  const Viewer = config.viewer || viewerComponentFor(property);

  return (
    <div className={classes.root}>
      <div className={clsx('flex', classes.title)}>
        <Typography variant="subtitle2">
          {title}
        </Typography>
      </div>
      <div className={clsx('flex justify-content-center', classes.content)}>
        <Viewer prop={property}
                value={value.get()}
                item={item} />
      </div>
    </div>
  );
}
