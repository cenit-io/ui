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

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    title: {
        flex: '0 0 auto',
    },
    spacer: {
        flex: '1 1 100%',
    }
}));

function CollectionActionsToolbar({ dataType, title, selectedKey, onSubjectPicked }) {

    const actionSubscription = useRef(null);

    const classes = useToolbarStyles();

    const tenantContext = useTenantContext();

    const containerContext = useContainerContext();

    const [containerState, setContainerState] = containerContext;

    const { selectedItems, data } = containerState;

    const execute = action => {
        const r = action.call(this, {
            dataType, tenantContext, selectedItems, containerContext
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
                    setContainerState({ actionKey, actionComponentKey: Random.string() });
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
                                    const r = action.call(this, { dataType, record: selectedItems[0], tenantContext });
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
                    loading: false
                }));
            }
        }
    };

    const clearSelection = () => {
        setContainerState({ selectedItems: [] });
        handleAction(Index.key);
    };

    let chip;
    if (selectedItems.length) {
        chip = <Chip label={`${selectedItems.length} selected`}
                     color='secondary'
                     onDelete={clearSelection}/>;
    } else {
        if (data) {
            chip = <Chip label={`about ${data.count}`}/>;
        }
    }

    return (
        <Toolbar className={classes.root}>
            <div className={classes.title}>
                <Typography variant="h6">
                    {title}
                </Typography>
            </div>
            <div className={classes.spacer}/>
            {chip}
            <div className={classes.spacer}/>
            <ActionPicker kind={ActionKind.collection}
                          arity={selectedItems.length}
                          onAction={handleAction}
                          selectedKey={selectedKey}
                          dataType={dataType}/>
        </Toolbar>
    );
}

export default CollectionActionsToolbar;
