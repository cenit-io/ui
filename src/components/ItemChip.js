import React, { useEffect, useState } from 'react';
import { Chip, CircularProgress, makeStyles, useTheme } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(1)
    }
}));

export const ItemChip = ({ dataType, item, onSelect, onDelete, selected, error, disabled, readOnly }) => {
    const classes = useStyles();
    const [title, setTitle] = useState(null);
    const itemKey = JSON.stringify(item);

    const theme = useTheme();

    useEffect(() => {
        const subscription = dataType.titleFor(item).subscribe(t => setTitle(t));
        return () => subscription.unsubscribe();
    }, [dataType, item, itemKey]);

    if (title) {
        return <Chip label={title}
                     onClick={onSelect}
                     onDelete={(!readOnly && onDelete) || null}
                     className={classes.chip}
                     color={selected ? 'primary' : (error ? 'secondary' : 'default')}
                     disabled={disabled}/>;
    }

    return <Skeleton variant="text"
                     width={theme.spacing(10)}
                     height={theme.spacing(5)}
                     className={classes.chip}/>;
};
