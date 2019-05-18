import React from 'react';
import {Chip, IconButton, LinearProgress} from "@material-ui/core";
import ClearIcon from '@material-ui/icons/Clear';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import RefPicker from "./RefPicker";


class RefManyControl extends React.Component {

    static getDerivedStateFromProps(props, state) {
        const { value } = props;
        if (value !== state.value) {
            return {
                value: value,
                items: (value && value.length === 0) ? [] : null,
                open: false
            };
        }

        return null;
    }

    state = { items: null };

    handlePick = item => {
        const value = this.props.value || [];
        value.push({ id: item.record.id });
        this.props.onChange(value);
        this.setState(prev => ({
            items: [...(prev.items || []), { id: item.record.id, title: item.title }],
            open: value.length > 0 || prev.open
        }));
    };

    addNew = () => {
        let { value, onChange } = this.props;
        if (value) {
            console.log('Adding ref...');
        } else {
            value = [];
        }
        onChange(value);
        if (value.length > 0) {
            this.setState({ open: true });
        }
    };

    setOpen = open => {
        const { property } = this.props;
        const value = this.props.value || [];
        if (open && !this.state.items) {
            property.dataType.titlesFor(...value).then(titles =>
                {this.setState({ items: titles.map((title, index) => ({ title, id: value[index].id })) })}
            );
        }

        this.setState({ open });
    };

    handleDelete = index => () => {
        const { value, onChange } = this.props;
        value.splice(index, 1);
        onChange(value);
        this.setState(prev => {
            const items = [...prev.items];
            items.splice(index, 1);
            return { items };
        })

    };

    handleSelect = index => () => {
        console.log('Selecting', this.state.items[index]);
    };

    render() {
        const { title, value, property, onDelete } = this.props,
            { open, items } = this.state;

        let dropButton, deleteButton, itemsControls;

        if (value) {
            if (open) {
                dropButton = value.length > 0 &&
                    <IconButton onClick={() => this.setOpen(false)}><ArrowDropUpIcon/></IconButton>;
                if (items) {
                    itemsControls = items.map(
                        (item, index) => <Chip key={`item_${index}`}
                                               label={item.title}
                                               onClick={this.handleSelect(index)}
                                               onDelete={this.handleDelete(index)}/>
                    );
                } else {
                    itemsControls = <LinearProgress style={{ flexGrow: 1 }}/>;
                }
            } else {
                dropButton = value.length > 0 &&
                    <IconButton onClick={() => this.setOpen(true)}><ArrowDropDownIcon/></IconButton>;
            }
            deleteButton = <IconButton onClick={onDelete}><ClearIcon/></IconButton>;
        }

        const AddNewIcon = value ? AddIcon : CreateIcon;

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex' }}>
                    <RefPicker dataType={property.dataType}
                               label={title}
                               onPick={this.handlePick}
                               text={value ? `${value.length} items` : ''}
                               disabled={items === null}/>
                    {dropButton}
                    <IconButton onClick={this.addNew}><AddNewIcon/></IconButton>
                    {deleteButton}
                </div>
                <div style={{ display: 'flex', paddingTop: '10px' }}>
                    {itemsControls}
                </div>
            </div>
        );
    }
}

export default RefManyControl;