import React, { useEffect, useRef, useState } from 'react';
import { Chip, makeStyles, useTheme } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { Title } from "../common/Symbols";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(1)
    }
}));

export const ItemChip = ({ dataType, item, onSelect, onDelete, selected, error, disabled, readOnly }) => {
    const classes = useStyles();
    const [title, setTitle] = useState(null);
    const flag = useRef(true);

    const theme = useTheme();

    useEffect(() => {
        const subscription = item.changed().pipe(
            switchMap(v => {
                    if (v) {
                        const title = v[Title];
                        if (title) {
                            return of(title);
                        }
                        return dataType.straightTitleFor(v);
                    }
                    return of('');
                }
            )
        ).subscribe(t => setTitle(t));
        if (flag.current) {
            flag.current = false;
            item.changed().next(item.get());
        }
        return () => subscription.unsubscribe();
    }, [dataType, item]);

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
