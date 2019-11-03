import React from 'react';
import Loading from '../components/Loading';
import { Checkbox, withStyles } from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from "@material-ui/core/TablePagination";
import ListIcon from '@material-ui/icons/List';
import ActionRegistry, { ActionKind } from "./ActionRegistry";

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
        page: 0,
        dense: false,
        limit: MinItemsPerPage
    };

    computeDataTypeState = async () => {
        const { dataType } = this.props;

        const queryProps = await dataType.queryProps(),

            props = (await Promise.all(queryProps.map(prop => prop.getTitle()))).map(
                (title, index) => ({ title, prop: queryProps[index] })
            );

        return { props };
    };

    requestData = async () => {

        const { dataType } = this.props,

            { limit, page } = this.state;

        return dataType.find('', {
            limit: limit,
            page: page,
            sort: { _id: -1 },
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
        this.select(selected);
    };

    handleSelectOne = id => () => {
        const { selection } = this.props;
        if (selection.length === 1 && selection[0] === id) {
            this.select([]);
        } else {
            this.select([id]);
        }
    }

    handleSelect = id => () => {
        const { selection } = this.props;
        const index = selection.indexOf(id);
        const newSelection = [...selection];

        if (index === -1) {
            newSelection.push(id);
        } else {
            newSelection.splice(index, 1);
        }

        this.select(newSelection);
    };

    select = selected => {
        this.props.onSelect(selected);
    }

    handleChangePage = (event, page) => {
        page++;
        this.setState({ page, data: null });
        this.select([]);
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({
            limit: +event.target.value,
            page: 0,
            data: null
        });
        this.select([]);
    };

    handleChangeDense = (event) => {
        this.setState({ dense: event.target.checked });
    };

    render() {

        const { height, selection, classes, theme } = this.props;

        const { props, data, dense, limit } = this.state;

        //const { order, orderBy, page} = this.state;

        //const isSelected = name => selection.indexOf(name) !== -1;

        let table, tableHeight = height;

        if (props) {
            if (data) {
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
                                     onClick={this.handleSelectOne(item.id)}
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
                                      onChange={this.handleSelect(item.id)}/>
                        </TableCell>
                        {
                            props.map(prop => (
                                <TableCell key={`${item.id}.${prop.prop.name}`}>
                                    {String(item[prop.prop.name])}
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
                                                  onChangePage={this.handleChangePage}
                                                  onChangeRowsPerPage={this.handleChangeRowsPerPage}/>;
                }

                table = <React.Fragment>
                    <div style={{ height: `calc(${tableHeight})`, overflow: 'auto' }}>
                        <Table className={classes.table}
                               size={dense ? 'small' : 'medium'}>
                            <EnhancedTableHead props={props}
                                               onSelectAllClick={this.handleSelectAllClick}
                                               numSelected={selection.length}
                                               rowCount={data.items.length}/>
                            <TableBody>
                                {rows}
                            </TableBody>
                        </Table>
                    </div>
                    {pagination}
                </React.Fragment>;
            } else {
                this.requestData().then(data => {
                    this.setState({ data })
                });
                table = <Loading height={`calc(${tableHeight})`}/>;
            }
        } else {
            this.computeDataTypeState().then(state => this.setState(state));
            table = <Loading height={`calc(${tableHeight})`}/>;
        }

        return table;
    }
}

export default ActionRegistry.register(withStyles(styles, { withTheme: true })(Index), {
    kind: ActionKind.collection,
    icon: ListIcon,
    title: 'List'
});
