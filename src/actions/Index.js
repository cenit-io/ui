import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { Checkbox, makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
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

const EnhancedTableHead = ({ props, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) => {

    const createSortHandler = property => event => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox"
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
                </TableCell>
                {
                    props.map(prop => (
                        <TableCell key={prop.prop.name}
                                   align={prop.numeric ? 'right' : 'left'}
                                   padding={prop.disablePadding ? 'none' : 'default'}
                                   sortDirection={orderBy === prop.prop.name ? order : false}
                                   style={{
                                       backgroundColor: "#fff",
                                       position: "sticky",
                                       top: 0,
                                       zIndex: 1
                                   }}>
                            <TableSortLabel active={orderBy === prop.prop.name}
                                            direction={order}
                                            onClick={createSortHandler(prop.prop.name)}>
                                {prop.title}
                            </TableSortLabel>
                        </TableCell>
                    ))
                }
            </TableRow>
        </TableHead>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
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

function Index({ dataType, subject, height, selectedItems, onSelect }) {

    const [props, setProps] = useState(null);
    const [itemsViewport, setItemsViewport] = useState(null);
    const [data, setData] = useState(null);
    const [dense, setDense] = useState(false);
    const [limit, setLimit] = useState(MinItemsPerPage);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('_id');
    const [page, setPage] = useState(0);
    const classes = useStyles();
    const theme = useTheme();

    const xs = useMediaQuery(theme.breakpoints.down('xs'));

    useEffect(() => {
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

                    return dataType.queryProps();
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
        ).subscribe(props => setProps(props));

        return () => subscription.unsubscribe();
    }, [dataType]);

    useEffect(() => {
        if (props) {
            const subscription = zzip(
                ...props.map(({ prop }) => prop.viewportToken())
            ).subscribe(
                tokens => setItemsViewport(`{_id ${tokens.join(' ')}}`)
            );
            return () => subscription.unsubscribe();
        }
    }, [props]);

    useEffect(() => {
        if (itemsViewport) {
            const subscription = dataType.find('', {
                limit: limit,
                page: page,
                sort: { _id: -1 },
                props: dataType.queryProps(),
                viewport: itemsViewport
            }).subscribe(data => setData(data));

            return () => subscription.unsubscribe();
        }
    }, [limit, page, dataType, itemsViewport]);

    const handleRequestSort = (event, property) => {
        const isDesc = orderBy === property && order === 'desc';

        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(property);
    }

    const handleSelectAllClick = event => {
        let selection;
        if (event.target.checked) {
            selection = [...data.items];
        } else {
            selection = [];
        }
        onSelect(selection);
    };

    const handleSelectOne = item => () => {
        if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
            onSelect([]);
        } else {
            onSelect([item]);
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

        onSelect(newSelection);
    };

    const handleChangePage = (_, page) => {
        setPage(page);
        setData(null);
        onSelect([]);
    };

    const handleChangeRowsPerPage = event => {
        setLimit(+event.target.value);
        setPage(0);
        setData(null);
        onSelect([]);
    };

    const handleChangeDense = event => {
        setDense(event.target.checked);
    };

    //const { order, orderBy, page} = this.state;

    //const isSelected = name => selectedItems.indexOf(name) !== -1;

    let tableHeight = height;

    if (!props || !data || !itemsViewport) {
        return <Loading height={`calc(${tableHeight})`}/>;
    }

    /*const headCells = props.map(prop => <TableCell key={prop.prop.name}
                                                   style={{
                                                       backgroundColor: "#fff",
                                                       position: "sticky",
                                                       top: 0
                                                   }}>{prop.title}</TableCell>);*/

    const rows = data.items.map(item => {
        let isSelected = selectedItems.findIndex(i => i.id === item.id) !== -1;
        return <TableRow hover
                         key={item.id}
                         onClick={handleSelectOne(item)}
                         role="checkbox"
                         aria-checked={isSelected}
                         tabIndex={-1}>
            <TableCell padding="checkbox"
                       style={{
                           backgroundColor: "#fff",
                           position: "sticky",
                           left: 0,
                           zIndex: 2
                       }}>
                <Checkbox checked={isSelected}
                          inputProps={{ 'aria-labelledby': item.id }}
                          onChange={handleSelect(item)}/>
            </TableCell>
            {
                props.map(prop => (
                    <TableCell key={`${item.id}.${prop.prop.name}`}>
                        {String(item[prop.prop.jsonKey])}
                    </TableCell>
                ))
            }
        </TableRow>
    });

    let pagination;

    if (data.count > MinItemsPerPage) {
        tableHeight = `${tableHeight} - ${theme.spacing(7)}px`;
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

    return <React.Fragment>
        <div style={{ height: `calc(${tableHeight})`, overflow: 'auto' }}>
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
        {pagination}
    </React.Fragment>;
}

export default ActionRegistry.register(Index, {
    kind: ActionKind.collection,
    icon: ListIcon,
    title: 'List'
});
