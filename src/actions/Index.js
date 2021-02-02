import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { Checkbox, fade, makeStyles, useMediaQuery, useTheme, withStyles } from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import ListIcon from '@material-ui/icons/List';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { map, switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import Pagination from "@material-ui/lab/Pagination/Pagination";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import clsx from "clsx";
import StringViewer from "../viewers/StringViewer";
import BooleanViewer from "../viewers/BooleanViewer";
import DateTimeViewer from "../viewers/DateTimeViewer";
import RefOneViewer from "../viewers/RefOneViewer";
import RefManyViewer from "../viewers/RefManyViewer";
import EmbedsOneViewer from "../viewers/EmbedsOneViewer";
import EmbedsManyViewer from "../viewers/EmbedsManyViewer";
import JsonViewer from "../viewers/JsonViewer";
import { useSpreadState } from "../common/hooks";
import { useContainerContext } from "./ContainerContext";
import { useOriginsStyles } from "../components/OriginsColors";

function viewerComponentFor(property, config) {
    let configViewer = config?.viewers;
    if (configViewer) {
        configViewer = configViewer[property.name];
        if (configViewer) {
            return configViewer;
        }
    }
    switch (property.type) {

        case 'refOne':
            return RefOneViewer;

        case 'refMany':
            return RefManyViewer;

        case 'embedsOne':
            return EmbedsOneViewer;

        case 'embedsMany':
            return EmbedsManyViewer;

        case 'boolean':
            return BooleanViewer;

        case 'string': {
            switch (property.propertySchema.format) {
                case 'date-time':
                case 'time':
                case 'date':
                    return DateTimeViewer;

                default:
                    return StringViewer;
            }
        }

        default: {
            if (!property.type || property.type === 'object' || property.type === 'array') {
                return JsonViewer;
            }
            return StringViewer;
        }
    }
}

const StyledTableCell = withStyles((theme) => ({
    head: {
        fontWeight: 700,
        backgroundColor: theme.palette.background.paper
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        height: '100%',
        '& th:first-child': {
            padding: 0
        },
        '& td:first-child': {
            height: '100%',
            backgroundColor: theme.palette.background.paper,
            padding: 0,
            '& div': {
                height: '100%',
                display: 'flex',
                alignItems: 'center'
            }
        },
        '&:nth-of-type(odd)': {
            backgroundColor: fade(theme.palette.action.hover, 0.02),
            '& td:first-child': {
                '& .check': {
                    backgroundColor: fade(theme.palette.action.hover, 0.02),
                }
            }
        },
        '&:hover': {
            '& td:first-child': {
                '& .check': {
                    background: `${theme.palette.action.hover} !important`
                }
            }
        }
    },
}))(TableRow);


const EnhancedTableHead = ({ props, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) => {

    const createSortHandler = property => event => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <StyledTableRow>
                <StyledTableCell padding="checkbox"
                                 style={{
                                     backgroundColor: "#fff",
                                     position: "sticky",
                                     top: 0,
                                     left: 0,
                                     zIndex: 3
                                 }}>
                    <Checkbox indeterminate={numSelected > 0 && numSelected < rowCount}
                              checked={numSelected === rowCount}
                              onChange={onSelectAllClick}
                              inputProps={{ 'aria-label': 'Select all' }}
                    />
                </StyledTableCell>
                {
                    props.map(prop => (
                        <StyledTableCell key={prop.prop.name}
                                         align={prop.numeric ? 'right' : 'left'}
                                         padding={prop.disablePadding ? 'none' : 'default'}
                                         sortDirection={orderBy === prop.prop.name ? order : false}
                                         style={{
                                             position: "sticky",
                                             top: 0,
                                             zIndex: 1
                                         }}>
                            <TableSortLabel active={orderBy === prop.prop.name}
                                            direction={order}
                                            onClick={createSortHandler(prop.prop.name)}>
                                {prop.title}
                            </TableSortLabel>
                        </StyledTableCell>
                    ))
                }
            </StyledTableRow>
        </TableHead>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
    },
    table: {
        height: 1
    },
    pagination: {
        height: theme.spacing(7)
    },
    pageSize: {
        margin: theme.spacing(0, 2)
    }
}));

const MinItemsPerPage = 5;

const ItemsPerPage = [MinItemsPerPage, 10, 25];

function ListView({ height, dataType }) {

    const [state, setState] = useSpreadState({
        order: 'asc',
        orderBy: '_id'
    });

    const [containerState, setContainerState] = useContainerContext();

    const { data, page, limit, selectedItems, props, itemsViewport, withOrigin } = containerState;

    const classes = useStyles();
    const originsClasses = useOriginsStyles();
    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    const { dense, order, orderBy, config } = state;

    useEffect(() => {
        const subscription = dataType.config().subscribe(
            config => setState({ config })
        );

        return () => subscription.unsubscribe();
    }, [dataType]);

    if (!config) {
        return <div/>;
    }

    const select = selectedItems => setContainerState({ selectedItems });

    const handleRequestSort = (event, property) => {
        const isDesc = orderBy === property && order === 'desc';
        setState({
            order: isDesc ? 'asc' : 'desc',
            orderBy: property
        });
    };

    const handleSelectAllClick = event => {
        let selection;
        if (event.target.checked) {
            selection = [...data.items];
        } else {
            selection = [];
        }
        select(selection);
    };

    const handleSelectOne = item => () => {
        if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
            select([]);
        } else {
            select([item]);
        }
    }

    const handleSelect = item => () => {
        const index = selectedItems.findIndex(i => i.id === item.id);
        const newSelection = [...selectedItems];

        if (index === -1) {
            newSelection.push(item);
        } else {
            newSelection.splice(index, 1);
        }

        select(newSelection);
    };

    const handleChangeDense = event => setState({ dense: event.target.checked });

    //const { order, orderBy, page} = this.state;

    //const isSelected = name => selectedItems.indexOf(name) !== -1;

    /*const headCells = props.map(prop => <StyledTableCell key={prop.prop.name}
                                                   style={{
                                                       backgroundColor: "#fff",
                                                       position: "sticky",
                                                       top: 0
                                                   }}>{prop.title}</StyledTableCell>);*/

    const rows = data.items.map(item => {
        let isSelected = selectedItems.findIndex(i => i.id === item.id) !== -1;
        return (
            <StyledTableRow hover
                            key={item.id}
                            onClick={handleSelectOne(item)}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={-1}>
                <StyledTableCell padding="checkbox"
                                 style={{
                                     color: '#fff',
                                     position: "sticky",
                                     left: 0,
                                     zIndex: 2
                                 }}>
                    <div className={clsx((withOrigin && originsClasses[item.origin]) || 'check')}>
                        <Checkbox className={clsx(withOrigin && originsClasses[`${item.origin}Text`])}
                                  checked={isSelected}
                                  inputProps={{ 'aria-labelledby': item.id }}
                                  onChange={handleSelect(item)}/>
                    </div>
                </StyledTableCell>
                {
                    props.map(({ prop }) => {
                        const Viewer = viewerComponentFor(prop, config);
                        return (
                            <StyledTableCell key={`${item.id}.${prop.name}`}>
                                <Viewer prop={prop}
                                        value={item[prop.jsonKey]}
                                        item={item}/>
                            </StyledTableCell>
                        );
                    })
                }
            </StyledTableRow>
        );
    });

    return (
        <div style={{ height: `calc(${height})`, overflow: 'auto' }}>
            <Table className={classes.table}
                   size={dense ? 'small' : 'medium'}>
                <EnhancedTableHead props={props}
                                   onSelectAllClick={handleSelectAllClick}
                                   numSelected={selectedItems.length}
                                   rowCount={data.items.length}/>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        </div>
    );
}

function DefaultIndex({ dataType, subject, height }) {

    const [containerState, setContainerState] = useContainerContext();

    const { data, page, limit, props, itemsViewport } = containerState;

    const classes = useStyles();
    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    useEffect(() => {
        setContainerState({ loading: true });
        const subscription = subject.config().pipe(
            switchMap(
                config => {
                    const configFields = config.actions?.index?.fields;
                    if (configFields) {
                        return dataType.properties().pipe(
                            map(
                                properties => configFields.map(
                                    field => properties[field]
                                )
                            )
                        );
                    }

                    return dataType.allProperties();
                }
            ),
            switchMap(
                props => zzip(...props.map(prop => prop.getTitle())).pipe(
                    map(
                        titles => titles.map(
                            (title, index) => ({ title, prop: props[index] })
                        )
                    )
                )
            )
        ).subscribe(props => setContainerState({ props }));

        return () => subscription.unsubscribe();
    }, [dataType]);

    useEffect(() => {
        if (props) {
            const subscription = zzip(
                dataType.withOrigin(),
                ...props.map(({ prop }) => prop.viewportToken())
            ).subscribe(
                ([withOrigin, ...tokens]) => {
                    if (withOrigin) {
                        tokens.push('origin');
                    }
                    setContainerState({ withOrigin, itemsViewport: `{_id ${tokens.join(' ')}}` });
                }
            );
            return () => subscription.unsubscribe();
        }
    }, [dataType, props]);

    useEffect(() => {
        if (itemsViewport) {
            setContainerState({ loading: true })
            const subscription = dataType.find('', {
                limit: limit,
                page: page,
                sort: { _id: -1 },
                props: dataType.queryProps(),
                viewport: itemsViewport
            }).subscribe(data => setContainerState(({ selectedItems }) => {
                const itemsHash = data.items.reduce((hash, item) => (hash[item.id] = item) && hash, {});
                selectedItems = selectedItems.map(({ id }) => itemsHash[id]).filter(item => item);
                return { data, loading: false, selectedItems };
            }));

            return () => subscription.unsubscribe();
        }
    }, [limit, page, dataType, itemsViewport]);

    const select = selectedItems => setContainerState({ selectedItems });

    const handleChangePage = (_, page) => {
        setContainerState({ data: null, page });
        select([]);
    };

    const handleChangeRowsPerPage = event => {
        setContainerState({
            data: null,
            limit: +event.target.value,
            page: 0
        });
        select([]);
    };

    if (!props || !data || !itemsViewport) {
        return <div/>;
    }

    let viewHeight = height;

    let pagination;

    if (data.count > MinItemsPerPage) {
        viewHeight = `${viewHeight} - ${theme.spacing(7)}px`;
        const pagOpts = {};
        if (xs) {
            pagOpts.siblingCount = 0;
        }
        pagination = (
            <div className={clsx('flex align-items-center', classes.pagination)}>
                <div className="grow-1"/>
                <Typography variant="subtitle2">
                    Page size
                </Typography>
                <Select className={classes.pageSize}
                        value={limit}
                        onChange={handleChangeRowsPerPage}>
                    {
                        ItemsPerPage.map((c, index) => (
                            <MenuItem key={`ipp_${index}_${c}`}
                                      value={c}>
                                {c}
                            </MenuItem>
                        ))
                    }
                </Select>
                <Pagination count={data.total_pages}
                            page={data.current_page}
                            {...pagOpts}
                            onChange={handleChangePage}
                            size="small"
                            color="primary"/>
            </div>
        );
    }

    return (
        <>
            <ListView height={viewHeight} dataType={dataType}/>
            {pagination}
        </>
    );
}

function Index(props) {
    const [config, setConfig] = useState(null);
    const { dataType } = props;

    useEffect(() => {
        const subscription = dataType.config().subscribe(
            config => setConfig(config)
        );
        return () => subscription.unsubscribe();
    }, [dataType]);

    if (config) {
        const IndexComponent = config.indexComponent || DefaultIndex;

        return <IndexComponent {...props}/>;
    }

    return <Loading/>;
}

export default ActionRegistry.register(Index, {
    kind: ActionKind.collection,
    bulkable: true,
    icon: ListIcon,
    title: 'List'
});
