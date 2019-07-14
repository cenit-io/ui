import React, {useState} from 'react';
import Loading from '../components/Loading';
import {Checkbox, makeStyles, Toolbar, Tooltip, Typography, useTheme, withStyles} from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import clsx from "clsx";
import {lighten} from "@material-ui/core/styles";
import {appBarHeight} from "../layout/AppBar";
import TablePagination from "@material-ui/core/TablePagination";

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
}));

const EnhancedTableToolbar = ({ numSelected }) => {
    const classes = useToolbarStyles();

    return (
        <Toolbar className={clsx(classes.root, { [classes.highlight]: numSelected > 0 })}>
            <div className={classes.title}>
                {numSelected > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {numSelected} selected
                    </Typography>
                ) : (
                    <Typography variant="h6" id="tableTitle">
                        Nutrition
                    </Typography>
                )}
            </div>
            <div className={classes.spacer}/>
            <div className={classes.actions}>
                {numSelected > 0 ? (
                    <Tooltip title="Delete">
                        <IconButton aria-label="Delete">
                            <DeleteIcon/>
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title="Filter list">
                        <IconButton aria-label="Filter list">
                            <FilterListIcon/>
                        </IconButton>
                    </Tooltip>
                )}
            </div>
        </Toolbar>
    );
};

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
                               zIndex: 1
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

const styles = theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
    }
});

const MinItemsPerPage = 5;

const ItemsPerPage = [MinItemsPerPage, 10, 25];

class Index extends React.Component {

    state = {
        order: 'asc',
        orderBy: 'id',
        selected: [],
        page: 0,
        dense: false,
        limit: 25
    };

    componentDidMount() {
        this.computeProps().then(props => this.setState({ props }))
    }

    computeProps = async () => {
        const { dataType } = this.props;

        const props = await dataType.queryProps();

        return (await Promise.all(props.map(prop => prop.getTitle()))).map(
            (title, index) => ({ title, prop: props[index] })
        );
    };

    requestData = async () => {

        const { dataType } = this.props,

            { limit, page } = this.state;

        return dataType.find('', {
            limit: limit,
            page: page,
            props: dataType.queryProps()
        });
    };

    handleRequestSort = (event, property) => {
        const { order, orderBy } = this.state,
            isDesc = orderBy === property && order === 'desc';

        this.setState({
            order: isDesc ? 'asc' : 'desc',
            orderBy: property
        });
    };

    handleSelectAllClick = event => {
        let selected;
        if (event.target.checked) {
            const { data } = this.state;
            selected = data.items.map(item => item.id);
        } else {
            selected = [];
        }
        this.setState({ selected });
    };

    handleClick = (event, name) => {
        const { selected } = this.state,
            selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        this.setState({ selected: newSelected });
    };

    handleChangePage = (event, page) => {
        page++;
        this.setState({ page, data: null, selected: [] });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({
            limit: +event.target.value,
            page: 0,
            data: null,
            selected: []
        });
    };

    handleChangeDense = (event) => {
        this.setState({ dense: event.target.checked });
    };

    render() {

        const { height, classes, theme } = this.props,

            { data, props, order, orderBy, selected, page, dense, limit } = this.state;

        const isSelected = name => selected.indexOf(name) !== -1;


        if (!props) {
            return <Loading/>;
        }

        let table;

        if (data) {
            const headCells = props.map(prop => <TableCell key={prop.prop.name}
                                                           style={{
                                                               backgroundColor: "#fff",
                                                               position: "sticky",
                                                               top: 0
                                                           }}>{prop.title}</TableCell>),

                rows = data.items.map(item => {
                    let isSelected = selected.indexOf(item.id) !== -1;
                    return <TableRow hover
                                     key={item.id}
                                     onClick={event => this.handleClick(event, item.id)}
                                     role="checkbox"
                                     aria-checked={isSelected}
                                     tabIndex={-1}>
                        <TableCell padding="checkbox">
                            <Checkbox checked={isSelected}
                                      inputProps={{ 'aria-labelledby': item.id }}/>
                        </TableCell>
                        {
                            props.map(prop => (
                                <TableCell key={`${item.id}.${prop.prop.name}`}>
                                    {item[prop.prop.name]}
                                </TableCell>
                            ))
                        }
                    </TableRow>
                });

            let tableHeight = `${height} - ${appBarHeight(theme)}`, pagination;

            if (data.count > MinItemsPerPage) {
                tableHeight = `${tableHeight} - ${theme.spacing(7)}px`;
                pagination = <TablePagination component='div'
                                              rowsPerPageOptions={ItemsPerPage}
                                              count={data.count}
                                              rowsPerPage={limit}
                                              page={data.current_page - 1}
                                              backIconButtonProps={{
                                                  'aria-label': 'Previous Page',
                                              }}
                                              nextIconButtonProps={{
                                                  'aria-label': 'Next Page',
                                              }}
                                              onChangePage={this.handleChangePage}
                                              onChangeRowsPerPage={this.handleChangeRowsPerPage}/>;
            }

            table = <Paper className={classes.root} style={{ height: `calc(${height})` }}>
                <EnhancedTableToolbar numSelected={selected.length}/>
                <div style={{ height: `calc(${tableHeight})`, overflow: 'auto' }}>
                    <Table className={classes.table}
                           size={dense ? 'small' : 'medium'}>
                        <EnhancedTableHead props={props}
                                           onSelectAllClick={this.handleSelectAllClick}
                                           numSelected={selected.length}
                                           rowCount={data.items.length}/>
                        <TableBody>
                            {rows}
                        </TableBody>
                    </Table>
                </div>
                {pagination}
            </Paper>;
        } else {
            this.requestData().then(data => {
                console.log(data);
                this.setState({ data })
            });
            table = <Loading/>;
        }


        return table;
    }
}

export default withStyles(styles, { withTheme: true })(Index);