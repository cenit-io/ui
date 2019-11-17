import React from 'react'
import StringControl from './StringControl';
import { LinearProgress, withStyles } from '@material-ui/core';
import './PropertyControl.css'
import EmbedsOneControl from "./EmbedsOneControl";
import EmbedsManyControl from "./EmbedsManyControl";
import BooleanControl from "./BooleanControl";
import RefOneControl from "./RefOneControl";
import RefManyControl from "./RefManyControl";
import ErrorMessages from "./ErrorMessages";
import zzip from "../util/zzip";

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
        zzip(this.props.property.getSchema(), this.props.property.getTitle()).subscribe( //TODO sanitize with unsubscribe
            ([schema, title]) => this.setState({ schema, title })
        );
    }

    render() {
        const { schema } = this.state;
        const { errors, property } = this.props;

        if (schema) {
            const ControlComponent = controlComponentFor(property);

            const control = <ControlComponent {...this.state} {...this.props}/>;

            return (
                <div className='prop-control'>
                    <ErrorMessages errors={ControlComponent.ownErrorMessages ? null : errors}>
                        {control}
                    </ErrorMessages>
                </div>
            );
        }

        return <LinearProgress/>;
    }
}

export default withStyles(styles, { withTheme: true })(PropertyControl);
