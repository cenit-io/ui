import React from 'react';
import NewIcon from '@material-ui/icons/Add';
import FormView from "../components/FormView";
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

    state = { changed: true, value: {} };

    handleChange = value => {
        this.setState({ changed: true, value })
    };

    save = () => {
        const { dataType } = this.props;
        const { value } = this.state;
        dataType.post(value)
            .then(response => console.log(response))
            .catch(error => this.setState({ errors: error.response.data }));
    };

    render() {

        const { dataType, classes } = this.props;
        const { changed, value, errors } = this.state;
        const actions = [];

        if (changed) {
            actions.push(
                <Fab color="primary"
                     key='save'
                     aria-label="add"
                     className={classes.fab}
                     onClick={this.save}>
                    <SaveIcon/>
                </Fab>
            );
        }

        return <div className={classes.formContainer}>
            <FormView dataType={dataType}
                      value={value}
                      errors={errors}
                      onChange={this.handleChange}/>
            <div className={classes.trailing}/>
            {actions}
        </div>;
    }
}

export default withStyles(styles, { withTheme: true })(New);
