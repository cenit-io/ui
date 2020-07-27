import React, { useEffect, useReducer, useRef } from 'react';
import reducer from "../common/reducer";
import Loading from "./Loading";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import clsx from "clsx";
import { DataTypeSubject, TabsSubject } from "../services/subjects";
import { DataType } from "../services/DataTypeService";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import Random from "../util/Random";
import Particles from 'react-tsparticles';
import Typography from "@material-ui/core/Typography";
import Search from "./Search";
import { DataTypeSelector } from "../layout/AppBar";
import FrezzerLoader from "./FrezzerLoader";

const useStyles = makeStyles(theme => ({
    header: {
        position: 'absolute',
        display: 'flex',
        width: '100%',
        height: theme.spacing(8),
        alignItems: 'center',
        background: theme.palette.background.default,
        top: 0
    },
    title: {
        padding: theme.spacing(0, 2)
    },
    groups: {
        position: 'absolute',
        top: theme.spacing(8),
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        overflowY: 'auto'
    },
    group: {
        margin: theme.spacing(1),
        padding: theme.spacing(1),
        background: theme.palette.primary.light,
        width: theme.spacing(30),
        borderRadius: theme.spacing(1)
    },
    groupHeader: {
        color: theme.palette.primary.contrastText,
        marginBottom: theme.spacing(1)
    },
    groupTitle: {
        marginLeft: theme.spacing(2)
    },
    items: {
        background: theme.palette.background.paper,
        borderRadius: theme.spacing(1)
    },
    item: {
        margin: theme.spacing(2, 0),
        cursor: 'pointer',
        '&:hover': {
            background: theme.palette.background.default
        }
    }
}));

export default function ({ subject, width, height }) {

    const [state, setState] = useReducer(reducer, {});
    const classes = useStyles();
    const theme = useTheme();

    const { config, item } = state;

    useEffect(() => {
        const subscription = subject.config().subscribe(
            config => setState({ config })
        );
        subject.computeTitle();
        return () => subscription.unsubscribe();
    }, [subject]);

    useEffect(() => {
        if (item) {
            const subscription = DataType.find(item.$ref).subscribe(
                dt => {
                    if (dt) {
                        TabsSubject.next(DataTypeSubject.for(dt.id).key)
                    }
                    setState({ item: null });
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [item]);

    if (!config) {
        return <Loading/>;
    }

    const subjectFor = ({ $ref }) => DataType.find($ref)

    const handleSelect = item => () => setState({ item });

    const handleDataTypeSelected = ({ id }) => TabsSubject.next(DataTypeSubject.for(id).key);

    const groups = config.groups.sort(
        (g1, g2) => g1.items.length - g2.items.length
    ).map(
        (group, gIndex) => {
            const items = group.items.map(
                (item, iIndex) => (
                    <ListItem button
                              key={`g_${gIndex}_${iIndex}`}
                              onClick={handleSelect(item)}>
                        <ListItemText primary={item.title}/>
                    </ListItem>
                )
            );

            const { IconComponent } = group;

            return (
                <div key={`g_${gIndex}`}>
                    <div className={clsx(classes.group, 'column')}>
                        <div className={clsx(classes.groupHeader, 'flex align-items-center')}>
                            <IconComponent/>
                            <div className={classes.groupTitle}>
                                {group.title}
                            </div>
                        </div>
                        <List className={classes.items}>
                            {items}
                        </List>
                    </div>
                </div>
            )
        }
    );

    let loader;
    if (item) {
        loader = <FrezzerLoader/>;
    }

    return (
        <div className="relative" style={{ height: `calc(${height})` }}>
            <div className={classes.header}>
                <Typography variant="h6" className={classes.title}>
                    Menu
                </Typography>
                <div className="grow-1"/>
                <Search dataTypeSelector={DataTypeSelector}
                        backColor="#ffffff"
                        backOverColor="#fffffe"
                        onSelect={({ record }) => handleDataTypeSelected(record)}/>
            </div>
            <div className={classes.groups} style={{ height: `calc(${height} - ${theme.spacing(8)}px)` }}>
                {groups}
            </div>
            {loader}
        </div>
    );
}
