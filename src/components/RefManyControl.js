import React from 'react';
import { Chip, IconButton, LinearProgress } from "@material-ui/core";
import ClearIcon from '@material-ui/icons/Clear';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import RefPicker from "./RefPicker";
import '../util/FlexBox.css';
import { map } from "rxjs/operators";


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
        value.push({ id: item.record.id, _reference: true });
        this.props.onChange(value);
        this.setState(prev => ({
            items: [...(prev.items || []), { id: item.record.id, title: item.title }],
            open: value.length > 0 || prev.open
        }));
    };

    addNew = () => {
        let { value, onChange, onStack, property } = this.props;
        if (value) {
            onStack({
                value: {},
                dataType: property.dataType,
                title: itemValue => property.dataType.titleFor(itemValue).pipe(
                    map(itemTitle => `[${property.name} #${value.length}] ${itemTitle}`)
                ),
                callback: itemValue => {
                    onChange([...value, itemValue]);
                    this.setOpen(true);
                }
            });
        } else {
            value = [];
            onChange(value);
        }
        if (value && value.length > 0) {
            this.setOpen(true);
        }
    };

    setOpen = open => {
        const { property } = this.props;
        const value = this.props.value || [];
        if (open && !this.state.items) {
            property.dataType.titlesFor(...value).subscribe(titles => {
                    this.setState({ items: titles.map((title, index) => ({ title, id: value[index].id })) })
                }
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
        const { onStack, property, value } = this.props;
        onStack({
            value: value[index],
            dataType: property.dataType,
            title: value => property.dataType.titleFor(value).pipe(map(title => `[${property.name} #${index}] ${title}`)),
            callback: item => property.dataType.titleFor(item).subscribe(
                title => this.setState(prev => {
                    const items = [...prev.items];
                    items[index] = { ...items[index], title };
                    return { items };
                })
            ),
            rootId: value[index].id
        });
    };

    render() {
        const { title, value, property, onDelete, disabled } = this.props;
        const { open, items } = this.state;

        let dropButton, deleteButton, itemsControls;

        if (value) {
            if (open) {
                dropButton = value.length > 0 &&
                    <IconButton onClick={() => this.setOpen(false)} disabled={disabled}><ArrowDropUpIcon/></IconButton>;
                if (items) {
                    itemsControls = items.map(
                        (item, index) => <Chip key={`item_${index}`}
                                               label={item.title}
                                               onClick={this.handleSelect(index)}
                                               onDelete={this.handleDelete(index)}
                                               style={{ margin: '4px' }}
                                               disabled={disabled}/>
                    );
                } else {
                    itemsControls = <LinearProgress className='grow-1'/>;
                }
            } else {
                dropButton = value.length > 0 &&
                    <IconButton onClick={() => this.setOpen(true)}
                                disabled={disabled}><ArrowDropDownIcon/></IconButton>;
            }
            deleteButton = <IconButton onClick={onDelete} disabled={disabled}><ClearIcon/></IconButton>;
        }

        const AddNewIcon = value ? AddIcon : CreateIcon;

        return (
            <div className='flex column'>
                <div className='flex'>
                    <RefPicker dataType={property.dataType}
                               label={title}
                               onPick={this.handlePick}
                               text={value ? `${value.length} items` : ''}
                               disabled={disabled || items === null}/>
                    {dropButton}
                    <IconButton onClick={this.addNew} disabled={disabled}><AddNewIcon/></IconButton>
                    {deleteButton}
                </div>
                <div className='flex wrap' style={{ paddingTop: '10px' }}>
                    {itemsControls}
                </div>
            </div>
        );
    }
}

export default RefManyControl;
