import React from 'react';
import { IconButton } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import RefPicker from "./RefPicker";
import { map } from "rxjs/operators";

class RefOneControl extends React.Component {

    static getDerivedStateFromProps(props, state) {
        const { value } = props;
        if (value) {
            if (value !== state.value) {
                props.property.dataType.titleFor(value).subscribe( //TODO sanitize with unsubscribe
                    text => {
                        if (text !== state.text) {
                            state.updateText(text);
                        }
                    });
                return { value };
            }
        } else {
            return { text: '' };
        }

        return null;
    }

    updateText = text => this.setState({ text });

    state = { updateText: this.updateText };

    handlePick = item => {
        const value = {
            id: item.record.id,
            _reference: true
        };
        //TODO this.state.value = value;
        this.props.onChange(value);
        this.setState({ value, text: item.title, item: item.record });
    };

    handleDelete = () => this.props.onDelete();

    handleAddNew = () => {
        const { onStack, property, onChange } = this.props;
        onStack({
            value: {},
            dataType: property.dataType,
            title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
            callback: newValue => onChange({
                id: newValue.id,
                _reference: true
            }),
            max: 1
        });
    };

    handleEdit = () => {
        const { onStack, property, onChange, value } = this.props;
        const { item } = this.state;
        onStack({
            value: item || value,
            dataType: property.dataType,
            title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name}] ${title}`)),
            callback: newValue => onChange({
                id: newValue.id,
                _reference: true
            }),
            rootId: value.id
        });
    };

    render() {
        const { title, value, property, disabled, readOnly } = this.props;
        const { text } = this.state;

        let addButton, editButton, deleteButton;

        if (value) {
            editButton = <IconButton onClick={this.handleEdit} disabled={disabled}><EditIcon/></IconButton>;
            if (!readOnly) {
                deleteButton = <IconButton onClick={this.handleDelete} disabled={disabled}><ClearIcon/></IconButton>;
            }
        }

        if (!readOnly) {
            addButton = <IconButton onClick={this.handleAddNew} disabled={disabled}><AddIcon/></IconButton>;
        }

        return (
            <div style={{ display: 'flex' }}>
                <RefPicker dataType={property.dataType}
                           label={title}
                           onPick={this.handlePick}
                           text={text}
                           disabled={disabled || text === null}
                           readOnly={readOnly}/>
                {editButton}
                {addButton}
                {deleteButton}
            </div>
        );
    }
}

export default RefOneControl;
