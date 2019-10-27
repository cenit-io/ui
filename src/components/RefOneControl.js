import React from 'react';
import { IconButton } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import RefPicker from "./RefPicker";

class RefOneControl extends React.Component {

    static getDerivedStateFromProps(props, state) {
        const { value } = props;
        if (value) {
            if (value !== state.value) {
                props.property.dataType.titlesFor(value).then(titles => state.updateText(titles[0]));
                return { value, text: null };
            }
        } else {
            return { text: '' };
        }

        return null;
    }

    updateText = text => this.setState({ text });

    state = { updateText: this.updateText };

    handlePick = item => {
        const value = { id: item.record.id };
        //TODO this.state.value = value;
        this.props.onChange(value);
        this.setState({ value, text: item.title });
    };

    handleDelete = () => this.props.onDelete();

    handleAddNew = () => {
        const { onStack, property } = this.props;
        onStack({
            value: {},
            dataType: property.dataType,
            title: async value => `[${property.name}] ${await property.dataType.titleFor(value)}`
        });
    };

    render() {
        const { title, value, property, disabled } = this.props;
        const { text } = this.state;

        let deleteButton;

        if (value) {
            deleteButton = <IconButton onClick={this.handleDelete} disabled={disabled}><ClearIcon/></IconButton>;
        }

        return (
            <div style={{ display: 'flex' }}>
                <RefPicker dataType={property.dataType}
                           label={title}
                           onPick={this.handlePick}
                           text={text}
                           disabled={disabled || text === null}/>
                <IconButton onClick={this.handleAddNew} disabled={disabled}><AddIcon/></IconButton>
                {deleteButton}
            </div>
        );
    }
}

export default RefOneControl;
