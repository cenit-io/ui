import React from 'react';
import { makeStyles } from "@material-ui/core/styles";
import EmbedsOneViewer from "./EmbedsOneViewer";

const useStyles = makeStyles(theme => ({
    chip: {
        '& + &': {
            marginLeft: theme.spacing(1)
        }
    }
}));

export default function EmbedsManyViewer({ prop, value }) {

    const classes = useStyles();

    if (value) {
        const viewers = value.map(
            (v, index) => <EmbedsOneViewer key={index}
                                           className={classes.chip}
                                           value={v}
                                           prop={prop}/>
        );

        return (
            <div className="flex">
                {viewers}
            </div>
        );
    }

    return <span>-</span>;
}
