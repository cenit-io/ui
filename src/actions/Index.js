import React, {useState} from 'react';
import Loading from '../components/Loading';
import {makeStyles, useTheme} from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing(3),
        overflowX: 'auto',
    },
    table: {
        minWidth: 650,
    },
}));

function Index({ dataType }) {

    const [state, setState] = useState({}),

        classes = useStyles(),

        { data, props } = state;

    async function buildState() {

        const data = await dataType.find('', {
            limit: 25,
            props: dataType.queryProps()
        });

        let props = await dataType.queryProps();

        props = (await Promise.all(props.map(prop => prop.getTitle()))).map(
            (title, index) => ({ title, prop: props[index] })
        );

        return { data, props };
    }

    if (!data) {
        buildState().then(state => setState(state));

        return <Loading/>;
    }

    const headCells = props.map(prop => <TableCell key={prop.prop.name}
        style={{
            backgroundColor: "#fff",
            position: "sticky",
            top: 0
        }}>{prop.title}</TableCell>),

        rows = data.items.map(
            item => <TableRow key={item.id}>
                {
                    props.map(prop => <TableCell key={`${item.id}.${prop.prop.name}`}>
                        {item[prop.prop.name]}
                    </TableCell>)
                }
            </TableRow>
        );

    return (
        <Paper className={classes.root}>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        {headCells}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows}
                </TableBody>
            </Table>
        </Paper>
    );
}

export default Index;