import React from 'react';
import RefOneViewer from "./RefOneViewer";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  chip: {
    '& + &': {
      marginLeft: theme.spacing(1)
    }
  }
}));

export default function RefManyViewer({ prop, value }) {

  const classes = useStyles();

  if (value) {
    const viewers = value.map(
      (v, index) => <RefOneViewer key={index}
                                  className={classes.chip}
                                  value={v}
                                  prop={prop} />
    );

    return (
      <div className="flex">
        {viewers}
      </div>
    );
  }

  return <span>-</span>;
}
