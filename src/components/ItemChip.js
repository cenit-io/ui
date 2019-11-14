import React, { useState } from 'react';
import { Chip, CircularProgress, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: `${theme.spacing(1)}px`
    }
}));

export const ItemChip = ({ dataType, item, onSelect, onDelete, selected, error, disabled }) => {

    const classes = useStyles();

    const [title, setTitle] = useState(null);

    dataType.titleFor(item).subscribe(t => {
        if (t !== title) { //TODO Use React effects
            setTitle(t);
        }
    });

    if (title) {
        return <Chip label={title}
                     onClick={onSelect}
                     onDelete={onDelete}
                     className={classes.chip}
                     color={selected ? 'primary' : (error ? 'secondary' : 'default')}
                     disabled={disabled}/>;
    }

    return <CircularProgress className={classes.chip}/>;
};
