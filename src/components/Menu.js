import React, { useEffect } from 'react';
import Loading from "./Loading";
import { fade, makeStyles, useTheme } from "@material-ui/core/styles";
import clsx from "clsx";
import { DataTypeSubject, TabsSubject } from "../services/subjects";
import { DataType } from "../services/DataTypeService";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Search from "./Search";
import { DataTypeSelector } from "../layout/AppBar";
import FrezzerLoader from "./FrezzerLoader";
import { useSpreadState } from "../common/hooks";
import { useTenantContext } from "../layout/TenantContext";

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
        overflowY: 'auto',
        backgroundColor: theme.palette.background.default
    },
    group: {
        margin: theme.spacing(1),
        boxShadow: '0 4px 8px 0 rgba(55, 71, 79, .3)',
        borderTopLeftRadius: theme.spacing(1),
        borderTopRightRadius: theme.spacing(1),
        width: '80vw',
        [theme.breakpoints.up('sm')]: {
            width: 'auto'
        },
    },
    groupHeader: {
        padding: theme.spacing(1.5, 4, 1.5, 6),
        borderTopLeftRadius: theme.spacing(1),
        borderTopRightRadius: theme.spacing(1),
        background: fade(theme.palette.primary.main, 0.85),
        color: theme.palette.getContrastText(theme.palette.primary.main)
    },
    groupTitle: {
        marginLeft: theme.spacing(4),
        fontWeight: 'bold'
    },
    groupItems: {
        padding: theme.spacing(1, 4, 0, 4),
        borderBottomLeftRadius: theme.spacing(1),
        borderBottomRightRadius: theme.spacing(1),
        background: theme.palette.background.paper,
    },
    items: {
        background: theme.palette.background.paper,
        borderRadius: theme.spacing(1)
    },
    item: {
        '& + &': {
            borderTop: `solid 1px ${theme.palette.text.disabled}`
        }
    }
}));

export default function ({ subject, height }) {

    const [state, setState] = useSpreadState();
    const classes = useStyles();
    const theme = useTheme();

    const [tenantState] = useTenantContext();

    const { user } = tenantState;

    const userRoles = user.roles || [];

    const isSuperUser = user.super_admin_enabled && !!userRoles.find(({ name }) => name === 'super_admin');

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
                        TabsSubject.next({
                            key: DataTypeSubject.for(dt.id).key
                        });
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

    const handleSelect = item => () => setState({ item });

    const handleDataTypeSelected = ({ id }) => TabsSubject.next({
        key: DataTypeSubject.for(id).key
    });

    const userConfig = {
        ...config,
        groups: (config.groups || []).map(group => ({
            ...group,
            items: (group.items || []).filter(
                ({ superUser, roles }) => (
                    (!superUser || isSuperUser) &&
                    (!roles || userRoles.find(role => roles.includes(role)))
                )
            )
        }))
    };

    const groups = userConfig.groups.sort(
        (g1, g2) => g1.items.length - g2.items.length
    ).map(
        (group, gIndex) => {
            const items = group.items.map(
                (item, iIndex) => (
                    <ListItem button
                              component="li"
                              className={classes.item}
                              key={`g_${gIndex}_${iIndex}`}
                              onClick={handleSelect(item)}>
                        <ListItemIcon>
                            {item.icon}
                        </ListItemIcon>
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
                        <div className={classes.groupItems}>
                            <List className={classes.items} component="ul">
                                {items}
                            </List>
                        </div>
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
                <Typography variant="h6" className={classes.title} component="h6">
                    Menu
                </Typography>
                <div className="grow-1"/>
                <Search dataTypeSelector={DataTypeSelector}
                        backColor="#ffffff"
                        backOverColor="#fffffe"
                        onSelect={({ record }) => handleDataTypeSelected(record)}/>
            </div>
            <div className={classes.groups} style={{ height: `calc(${height} - ${theme.spacing(8)}px)`}}>
                {groups}
            </div>
            {loader}
        </div>
    );
}
