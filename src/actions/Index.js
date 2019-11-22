import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { Checkbox, makeStyles, useTheme } from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from "@material-ui/core/TablePagination";
import ListIcon from '@material-ui/icons/List';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { map, switchMap } from "rxjs/operators";
import zzip from "../util/zzip";

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
    }
}));

const MinItemsPerPage = 5;

const ItemsPerPage = [MinItemsPerPage, 10, 25];

function Index({ dataType, height, selection, onSelect }) {

    const [props, setProps] = useState(null);
    const [data, setData] = useState(null);
    const [dense, setDense] = useState(false);
    const [limit, setLimit] = useState(MinItemsPerPage);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('_id');
    const [page, setPage] = useState(0);
    const classes = useStyles();
    const theme = useTheme();

    useEffect(() => {
        const subscription = dataType.queryProps().pipe(
            switchMap(
                queryProps => zzip(...queryProps.map(prop => prop.getTitle())).pipe(
                    map(
                        titles => titles.map(
                            (title, index) => ({ title, prop: queryProps[index] })
                        )
                    )
                )
            )
        ).subscribe(props => setProps(props));

        return () => subscription.unsubscribe();
    }, [dataType]);

    useEffect(() => {
        const subscription = dataType.find('', {
            limit: limit,
            page: page,
            sort: { _id: -1 },
            props: dataType.queryProps()
        }).subscribe(data => setData(data));

        return () => subscription.unsubscribe();
    }, [limit, page, dataType]);

    const handleRequestSort = (event, property) => {
        const isDesc = orderBy === property && order === 'desc';

        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(property);
    };

    const select = selected => {
        onSelect(selected);
    }

    const handleSelectAllClick = event => {
        let selected;
        if (event.target.checked) {
            selected = data.items.map(item => item.id);
        } else {
            selected = [];
        }
        select(selected);
    };

    const handleSelectOne = id => () => {
        if (selection.length === 1 && selection[0] === id) {
            select([]);
        } else {
            select([id]);
        }
    }

    const handleSelect = id => () => {
        const index = selection.indexOf(id);
        const newSelection = [...selection];

        if (index === -1) {
            newSelection.push(id);
        } else {
            newSelection.splice(index, 1);
        }

        select(newSelection);
    };

    const handleChangePage = (event, page) => {
        page++;
        setPage(page);
        setData(null);
        select([]);
    };

    const handleChangeRowsPerPage = event => {
        setLimit(+event.target.value);
        setPage(0);
        setData(null);
        select([]);
    };

    const handleChangeDense = event => {
        setDense(event.target.checked);
    };

    //const { order, orderBy, page} = this.state;

    //const isSelected = name => selection.indexOf(name) !== -1;

    let tableHeight = height;

    if (!props || !data) {
        return <Loading height={`calc(${tableHeight})`}/>;
    }

    /*const headCells = props.map(prop => <TableCell key={prop.prop.name}
                                                   style={{
                                                       backgroundColor: "#fff",
                                                       position: "sticky",
                                                       top: 0
                                                   }}>{prop.title}</TableCell>);*/

    const rows = data.items.map(item => {
        let isSelected = selection.indexOf(item.id) !== -1;
        return <TableRow hover
                         key={item.id}
                         onClick={handleSelectOne(item.id)}
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
                          onChange={handleSelect(item.id)}/>
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
        pagination = <TablePagination component='div'
                                      rowsPerPageOptions={ItemsPerPage}
                                      labelRowsPerPage='Page size'
                                      count={data.count}
                                      rowsPerPage={limit}
                                      page={data.current_page - 1}
                                      backIconButtonProps={{
                                          'aria-label': 'Previous Page',
                                      }}
                                      nextIconButtonProps={{
                                          'aria-label': 'Next Page',
                                      }}
                                      onChangePage={handleChangePage}
                                      onChangeRowsPerPage={handleChangeRowsPerPage}/>;
    }

    return <React.Fragment>
        <div style={{ height: `calc(${tableHeight})`, overflow: 'auto' }}>
            <Table className={classes.table}
                   size={dense ? 'small' : 'medium'}>
                <EnhancedTableHead props={props}
                                   onSelectAllClick={handleSelectAllClick}
                                   numSelected={selection.length}
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
