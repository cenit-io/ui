import React from "react";
import { useContainerContext } from "../actions/ContainerContext";
import { useOriginsStyles } from "./OriginsColors";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Image from 'material-ui-image';

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(0)
    },
    card: {
        margin: theme.spacing(3),
        width: theme.spacing(24),
        minHeight: theme.spacing(32),
        cursor: 'pointer',
        '&:hover': {
            background: theme.palette.action.hover
        }
    },
    header: {
        padding: theme.spacing(1),
        textAlign: 'center'
    },
    selected: {
        background: theme.palette.action.selected
    },
    picture: {
        padding: theme.spacing(2),
        width: '100%',
        boxSizing: 'border-box'
    },
    brokenImage: {
        fontSize: theme.spacing(10),
        color: theme.palette.text.disabled
    },
    summary: {
        padding: theme.spacing(2),
        textAlign: 'center'
    }
}));

export default function CollectionsView({ height, width }) {

    const [containerState, setContainerState] = useContainerContext();

    const { data, selectedItems } = containerState;

    const select = selectedItems => setContainerState({ selectedItems });

    const classes = useStyles();
    const originsClasses = useOriginsStyles();

    const handleSelectOne = item => () => {
        if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
            select([]);
        } else {
            select([item]);
        }
    };

    const cards = data.items.map(item => {
        let isSelected = selectedItems.findIndex(i => i.id === item.id) !== -1;
        return (
            <Box key={item.id}
                 className={clsx(classes.card, isSelected && classes.selected)}
                 onClick={handleSelectOne(item)}
                 boxShadow={3}>
                <Typography className={clsx(originsClasses[item.origin], classes.header)}
                            variant="subtitle1">
                    {item.title}
                </Typography>
                <div className="flex column align-items-center">
                    <div className={classes.picture}>
                        <Image src={item.picture?.public_url || 'broken'} style={{ width: '100%' }}/>
                    </div>
                    <Typography variant="caption" className={classes.summary}>
                        {item.summary}
                    </Typography>
                </div>
            </Box>
        );
    });

    return (
        <div className={clsx('flex wrap align-items-center justify-content-center border-box', classes.root)}
             style={{ height: `calc(${height})`, width: `calc(${width})`, overflow: 'auto' }}>
            {cards}
        </div>
    );
}
