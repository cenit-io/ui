import React, { useEffect, useState } from 'react';
import { Chip, CircularProgress, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: `${theme.spacing(1)}px`
    }
}));

export const ItemChip = ({ dataType, item, onSelect, onDelete, selected, error, disabled }) => {
    const classes = useStyles();
    const [title, setTitle] = useState(null);
    const itemKey = JSON.stringify(item);

    useEffect(() => {
        const subscription = dataType.titleFor(item).subscribe(t => setTitle(t));
        return () => subscription.unsubscribe();
    }, [dataType, item, itemKey]);

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
