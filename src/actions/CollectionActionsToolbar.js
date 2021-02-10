import React, { useRef } from 'react';
import { makeStyles, Toolbar, Typography, Chip } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionPicker from "./ActionPicker";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { isObservable, of } from "rxjs";
import Random from "../util/Random";
import { switchMap } from "rxjs/operators";
import { RecordSubject } from "../services/subjects";
import { useContainerContext } from "./ContainerContext";
import Index from "./Index";
import { useTenantContext } from "../layout/TenantContext";
import Filter, { FilterIcon } from "./Filter";
import IconButton from "@material-ui/core/IconButton";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    title: {
        flex: '0 0 auto',
    },
    filterIcon: {
        color: theme.palette.getContrastText(theme.palette.secondary.main)
    }
}));

function CollectionActionsToolbar({ dataType, title, selectedKey, onSubjectPicked }) {

    const actionSubscription = useRef(null);

    const classes = useToolbarStyles();

    const tenantContext = useTenantContext();

    const containerContext = useContainerContext();

    const [containerState, setContainerState] = containerContext;

    const { selectedItems, data, selector } = containerState;

    const execute = action => {
        const r = action.call(this, {
            dataType, tenantContext, selectedItems, containerContext, selector
        });
        if (isObservable(r)) {
            setContainerState({ loading: true });
            actionSubscription.current = r.subscribe(() => {
                setContainerState({
                    loading: false,
                    actionKey: Index.key,
                    actionComponentKey: Random.string()
                });
            });
        }
    };

    const handleAction = actionKey => {
        if (actionSubscription.current) {
            actionSubscription.current.unsubscribe();
            actionSubscription.current = null;
        }
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            if (!action.kind || action.kind === ActionKind.collection || action.bulkable) {
                if (action.executable) {
                    execute(action);
                } else {
                    if (action.drawer) {
                        setContainerState({ drawerActionKey: actionKey });
                    } else {
                        setContainerState({ actionKey, actionComponentKey: Random.string() });
                    }
                }
            } else {
                setContainerState({ loading: true });
                const { _type, id } = selectedItems[0];
                actionSubscription.current = (
                    ((!_type || _type === dataType.type_name()) && of(dataType)) ||
                    dataType.findByName(_type)
                ).pipe(
                    switchMap(dataType => {
                            if (dataType) {
                                if (action.executable) {
                                    const r = action.call(this, {
                                        dataType,
                                        record: selectedItems[0],
                                        tenantContext,
                                        containerContext,
                                        selector
                                    });
                                    if (isObservable(r)) {
                                        return r;
                                    }
                                } else {
                                    onSubjectPicked(RecordSubject.for(dataType.id, id).key);
                                }
                                return of(true);
                            }
                        }
                    )
                ).subscribe(() => setContainerState({
                    selectedItems: [],
                    loading: false,
                    actionComponentKey: Random.string()
                }));
            }
        }
    };

    const clearSelection = () => {
        if (selectedItems.length) {
            setContainerState({ selectedItems: [] });
            handleAction(Index.key);
        } else if (Object.keys(selector).length) {
            setContainerState({ actionKey: Filter.key });
        }
    };

    let chip;
    if (selectedItems.length) {
        chip = <Chip label={`${selectedItems.length} selected`}
                     color='secondary'
                     onDelete={clearSelection}/>;
    } else {
        if (data) {
            const selection = Object.keys(selector).length;
            if (selection) {
                const msg = data.count
                    ? `found ${data.count}`
                    : 'no records found';
                chip = <Chip label={msg}
                             color='secondary'
                             onDelete={clearSelection}
                             onClick={clearSelection}
                             deleteIcon={(
                                 <IconButton size="small" className={classes.filterIcon}>
                                     <FilterIcon/>
                                 </IconButton>
                             )}/>;
            } else {
                const msg = data.count
                    ? `about ${data.count}`
                    : 'no records found';
                chip = <Chip label={msg}/>;
            }
        }
    }

    return (
        <Toolbar className={classes.root}>
            <div className={classes.title}>
                <Typography variant="h6">
                    {title}
                </Typography>
            </div>
            <div className="grow-1"/>
            {chip}
            <ActionPicker kind={ActionKind.collection}
                          arity={selectedItems.length}
                          onAction={handleAction}
                          selectedKey={selectedKey}
                          dataType={dataType}/>
        </Toolbar>
    );
}

export default CollectionActionsToolbar;
