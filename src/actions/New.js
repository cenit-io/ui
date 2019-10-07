import React from 'react';
import NewIcon from '@material-ui/icons/Add';
import ObjectControl from "../components/ObjectControl";
import FormTest from "../components/FormTest";
import {withStyles} from "@material-ui/core";
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/Save';

const styles = theme => ({
    root: {
        width: '100%',
        overflow: 'auto',
    },
    formContainer: {
        height: props => `calc(${props.height})`,
        overflow: 'auto'
    },
    trailing: {
        height: `${theme.spacing(8)}px`
    },
    fab: {
        position: 'absolute',
        top: props => `calc(${props.height})`,
        left: props => `calc(${props.width} - ${theme.spacing(10)}px)`
    },
});

class New extends React.Component {

    static Icon = NewIcon;

    static title = 'New';

    render() {

        const { dataType, theme, classes, width } = this.props;

        console.log(width);

        return <div className={classes.formContainer}>
            <FormTest dataType={dataType}/>
            <div className={classes.trailing}/>
            <Fab color="primary" aria-label="add" className={classes.fab}>
                <SaveIcon/>
            </Fab>
        </div>;
    }
}

export default withStyles(styles, { withTheme: true })(New);
