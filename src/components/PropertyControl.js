import React from 'react'
import StringControl from './StringControl';
import {LinearProgress, withStyles} from '@material-ui/core';
import './PropertyControl.css'
import EmbedsOneControl from "./EmbedsOneControl";
import EmbedsManyControl from "./EmbedsManyControl";
import BooleanControl from "./BooleanControl";
import RefOneControl from "./RefOneControl";
import RefManyControl from "./RefManyControl";

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

        if (schema) {
            const ControlComponent = controlComponentFor(this.props.property);
            return (
                <div className='prop-control'>
                    <ControlComponent {...this.state} {...this.props}/>
                </div>
            );
        }

        return <LinearProgress/>;
    }
}

export default withStyles(styles, { withTheme: true })(PropertyControl);