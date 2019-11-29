import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { Chip, IconButton, Toolbar, Typography, useTheme } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from "@material-ui/icons/Refresh";
import Show from "./Show";
import Random from "../util/Random";
import { DataType } from "../services/DataTypeService";
import { DataTypeId, TitleSubject } from "../common/Symbols";
import { switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import { of } from "rxjs";
import copySymbols from "../util/cpSymbols";
import ChevronRight from "@material-ui/core/SvgIcon/SvgIcon";
import ActionPicker from "./ActionPicker";
import Alert from "./Alert";


const actionContainerStyles = makeStyles(theme => ({
    toolbar: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
        height: appBarHeight(theme)
    },
    breadcrumb: {
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center'
    },
    spacer: {
        flex: '1 1 100%',
    },
    actionContainer: {
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        height: props => `calc(${props.height} - ${appBarHeight(theme)})`
    }
}));

function MemberContainer({ docked, item, height, width, onItemPickup, onClose, updateItem }) {
    const [memberItem, setMemberItem] = useState(null);
    const [actionKey, setActionKey] = useState(Show.key);
    const [dataType, setDataType] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [actionComponentKey, setActionComponentKey] = useState(Random.string());
    const [dataTypeTitle, setDataTypeTitle] = useState(null);
    const [itemTitle, setItemTitle] = useState(null);
    const [error, setError] = useState(null);

    const theme = useTheme();
    const classes = actionContainerStyles();

    useEffect(() => {
        const subscription = DataType.getById(item[DataTypeId]).pipe(
            switchMap(
                dataType => {
                    setDataType(dataType);
                    setMemberItem(null);
                    if (dataType) {
                        return dataType.titleViewPort('_id').pipe(
                            switchMap(
                                viewport => {
                                    return zzip(
                                        dataType.getTitle(),
                                        dataType.get(item.id, { viewport })
                                    )
                                }
                            )
                        );
                    }
                    setError(`Data type with ID ${item[DataTypeId]} not found!`);
                    return of([null, null]);
                }
            )
        ).subscribe(([dataTypeTitle, titledItem]) => {
            setDataTypeTitle(dataTypeTitle);
            if (titledItem) {
                setMemberItem(copySymbols(item, titledItem));
            } else {
                setError(`${dataTypeTitle} record with ID ${item.id} not found!`);
            }
        });

        return () => subscription.unsubscribe();
    }, [item])

    useEffect(() => {
        if (dataType && memberItem) {
            const subscription = dataType.titleFor(memberItem).subscribe(
                itemTitle => {
                    memberItem[TitleSubject].next(itemTitle);
                    setItemTitle(itemTitle);
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [dataType, memberItem]);

    if (error) {
        return <Alert message={error}/>;
    }

    if (!memberItem) {
        return <Loading/>;
    }

    const handleAction = actionKey => {
        const action = ActionRegistry.byKey(actionKey);
        if (action) {
            setActionComponentKey(Random.string());
            setActionKey(actionKey);
        }
    };

    const handleUpdateItem = item => {
        setMemberItem(copySymbols(memberItem, item));
        updateItem && updateItem(item);
    };

    const breadcumb = (
        <div className={classes.breadcrumb}>
            <Chip label={dataTypeTitle} onClick={() => onItemPickup({ [DataTypeId]: dataType.id })}/>
            <ChevronRight/>
            <Typography variant="h6">
                {itemTitle}
            </Typography>
        </div>
    );

    const componentHeight = `${height} - ${appBarHeight(theme)}`;

    const ActionComponent = ActionRegistry.byKey(actionKey);

    const action = ActionComponent && <ActionComponent key={actionComponentKey}
                                                       docked={docked}
                                                       dataType={dataType}
                                                       item={item}
                                                       updateItem={handleUpdateItem}
                                                       height={componentHeight}
                                                       width={width}
                                                       onItemPickup={onItemPickup}
                                                       onCancel={() => handleAction(Show.key)}
                                                       onDisable={disabled => setDisabled(disabled)}
                                                       onClose={onClose}/>;

    return <React.Fragment>
        <Toolbar className={classes.toolbar}>
            {breadcumb}
            <div className={classes.spacer}/>
            <ActionPicker kind={ActionKind.member}
                          arity={1}
                          onAction={handleAction}
                          disabled={disabled}/>
            <IconButton disabled={disabled}
                        onClick={() => setActionComponentKey(Random.string())}>
                <RefreshIcon/>
            </IconButton>
        </Toolbar>
        <div className={classes.actionContainer}
             style={{ height: `calc(${componentHeight})` }}>
            {action}
        </div>
    </React.Fragment>;
}

export default MemberContainer;
