import React from 'react'
import StringControl from './StringControl';
import {LinearProgress, withStyles} from '@material-ui/core';
import './PropertyControl.css'
import EmbedsOneControl from "./EmbedsOneControl";
import EmbedsManyControl from "./EmbedsManyControl";
import BooleanControl from "./BooleanControl";
import RefOneControl from "./RefOneControl";
import RefManyControl from "./RefManyControl";
import ErrorMessages from "./ErrorMessages";

function controlComponentFor(property) {
    switch (property.type) {

        case 'object': {
            return EmbedsOneControl;
        }

        case 'array': {
            return EmbedsManyControl;
        }

        case 'boolean': {
            return BooleanControl;
        }

        case 'refOne': {
            return RefOneControl;
        }

        case 'refMany': {
            return RefManyControl;
        }

        default: {
            return StringControl;
        }
    }
}

const styles = theme => ({
    root: {
        paddingLeft: `${theme.spacing(1)}px`
    },
    error: {
        color: theme.palette.error.main
    }
});

class PropertyControl extends React.Component {

    state = {};

    componentDidMount() {
        Promise.all([
            this.props.property.getSchema(),
            this.props.property.getTitle(),
        ]).then(([schema, title]) => this.setState({ schema, title }));
    }

    render() {
        const { schema } = this.state;
        const { errors } = this.props;

        if (schema) {
            const ControlComponent = controlComponentFor(this.props.property);
            let control = <ControlComponent {...this.state} {...this.props}/>;

            if (!ControlComponent.ownErrorMessages) {
                control =
                    <ErrorMessages errors={errors}>
                        {control}
                    </ErrorMessages>;
            }

            return (
                <div className='prop-control'>
                    {control}
                </div>
            );
        }

        return <LinearProgress/>;
    }
}

export default withStyles(styles, { withTheme: true })(PropertyControl);
