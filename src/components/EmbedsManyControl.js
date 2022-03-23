import React, { useEffect, useRef } from 'react';
import { IconButton, TextField } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import ObjectControl from "./ObjectControl";
import { Property } from "../services/DataTypeService";
import '../common/FlexBox.css';
import { ItemChip } from "./ItemChip";
import { map, switchMap } from "rxjs/operators";
import { FETCHED, INDEX, Key, NEW } from "../common/Symbols";
import { useSpreadState } from "../common/hooks";
import Random from "../util/Random";
import { useFormContext } from "./FormContext";
import { ReactSortable } from "react-sortablejs";


function EmbedsManyControl({
                               title, value, property, errors, onDelete, onChange,
                               schema, disabled, onStack, readOnly, ready,
                               addDisabled, deleteDisabled, sortDisabled, config
                           }) {

    const [state, setState] = useSpreadState({
        open: false,
        selectedIndex: -1,
        items: value.get()
    });
    const indexed = useRef(false);

    const { initialFormValue } = useFormContext();

    const setOpen = open => setState({ open });
    const setSelectedIndex = selectedIndex => setState({ selectedIndex });

    const controlPropertyRef = useRef(new Property({
        dataType: property.dataType,
        propertySchema: schema
    }));

    const { open, selectedIndex, items } = state;

    const controlProperty = controlPropertyRef.current;

    useEffect(() => {
        if (value) {
            const subscription = value.changed().subscribe(
                items => setState({ items })
            );

            value.changed().next(value.get());
            return () => subscription.unsubscribe();
        }
    }, [value]);

    useEffect(() => {
        if (ready && !indexed.current) {
            indexed.current = true;
            if (items) {
                items.forEach((item, index) => item[INDEX] = index);
            }
        }
    }, [items, ready]);


    const addNew = () => {
        let items = value.get();
        let seed;
        if (config.seed) {
            if (typeof config.seed === 'function') {
                seed = config.seed(property.dataType, value);
            } else {
                seed = config.seed;
            }
        }
        if (items) {
            value.set(items = [...items, {
                [NEW]: true,
                [FETCHED]: true,
                ...seed
            }]);
        } else {
            items = [];
        }
        setSelectedIndex(items.length - 1);
        if (items.length > 0) {
            setOpen(true);
        }
        value.set(items);
        setState({ items });
        onChange(items);
    };

    const deleteIndex = index => {
        value.indexValue(index).delete();
        const newValue = value.get();
        if (newValue.length === 0) {
            setOpen(false);
        } else if (selectedIndex === index) {
            setSelectedIndex(-1);
        } else if (selectedIndex === newValue.length) {
            setSelectedIndex(newValue.length - 1);
        }
        onChange(newValue);
    };

    /* TODO const seek = (x) => () => {
        let tmp = value[selectedIndex];
        value[selectedIndex] = value[selectedIndex + x];
        value[selectedIndex + x] = tmp;
        setSelectedIndex(selectedIndex + x);
        onChange(value);
    }; */

    const handleChange = item => {
        value.indexValue(selectedIndex).set(item);
        const newValue = value.get();
        onChange(newValue);
    };

    const handleClear = () => {
        const initialValue = value.valueFrom(initialFormValue);
        if (initialValue) {
            value.set(null);
        } else {
            value.delete();
        }
        onDelete();
        setState({ items: undefined });
    };

    const selectItem = index => () => setSelectedIndex(index);

    const deleteItem = index => () => deleteIndex(index);

    let dropButton, deleteButton, itemChips;

    const handleStack = item => onStack({
        ...item,
        title: itemValue => property.dataType.titleFor(value.get()[selectedIndex]).pipe(
            switchMap(
                selectedTitle => item.title(itemValue).pipe(
                    map(
                        itemTitle => `[${property.name} #${selectedIndex}] ${selectedTitle} ${itemTitle}`
                    )
                )
            )
        )
    });

    const sort = indices => {
        const hash = {};
        value.get().forEach(item => hash[item[Key]] = item);
        const selectedKey = selectedIndex === -1
            ? null
            : value.cache[selectedIndex][Key];
        let modified = false;
        let newSelectedIndex = -1;
        const items = indices.map(({ id: key }, index) => {
            modified = modified || key !== value.cache[index][Key];
            if (key === selectedKey) {
                newSelectedIndex = index;
            }
            return hash[key];
        });
        if (modified) {
            value.set(items);
            onChange(items);
            setState({
                items,
                selectedIndex: newSelectedIndex
            });
        }
    };

    if (items) {
        if (open) {
            itemChips = items.map((item, index) => {
                if (!item[Key]) {
                    item[Key] = Random.string();
                }

                return <ItemChip key={`item_${item[Key]}`}
                                 dataType={property.dataType}
                                 item={value.indexValue(index)}
                                 onSelect={selectItem(index)}
                                 onDelete={deleteItem(index)}
                                 selected={selectedIndex === index}
                                 disabled={disabled}
                                 readOnly={readOnly || deleteDisabled}/>;
            });

            if (!readOnly && !disabled && !sortDisabled) {
                itemChips = (
                    <ReactSortable list={items.map(item => ({ id: item[Key] }))}
                                   setList={sort}>
                        {itemChips}
                    </ReactSortable>
                );
            }

            dropButton = items.length > 0 && (
                <IconButton onClick={() => setOpen(false)} disabled={disabled}>
                    <ArrowDropUpIcon/>
                </IconButton>
            );

            let itemControl;

            if (selectedIndex !== -1) {
                controlProperty.jsonKey = controlProperty.name = selectedIndex;
                itemControl = (
                    <ObjectControl property={controlProperty}
                                   fetchPath={`${value.jsonPath()}[${items[selectedIndex][INDEX]}]`}
                                   value={value.indexValue(selectedIndex)}
                                   errors={errors && errors[String(selectedIndex)]}
                                   onChange={handleChange}
                                   disabled={disabled}
                                   readOnly={readOnly}
                                   onStack={handleStack}/>
                );
            }

            itemChips = (
                <div className='flex column'>
                    <div style={{ display: 'flex', paddingTop: '10px', flexWrap: 'wrap' }}>
                        {itemChips}
                    </div>
                    {itemControl}
                </div>
            );
        } else {
            dropButton = items.length > 0 &&
                <IconButton onClick={() => setOpen(true)} disabled={disabled}>
                    <ArrowDropDownIcon/>
                </IconButton>;
        }
        if (!readOnly && !deleteDisabled) {
            deleteButton = <IconButton onClick={handleClear} disabled={disabled}><ClearIcon/></IconButton>;
        }
    }

    let addButton;
    if (!readOnly && !addDisabled) {
        const AddNewIcon = items ? AddIcon : CreateIcon;
        addButton = <IconButton onClick={addNew} disabled={disabled}><AddNewIcon/></IconButton>;
    }

    const itemsCount = items ? `${items.length} items` : '';

    const placeholder = itemsCount || String(items) || itemsCount;

    return (
        <div className='flex full-width column'>
            <div className='flex full-width'>
                <TextField label={title}
                           readOnly
                           style={{ flexGrow: 1 }}
                           value={itemsCount}
                           placeholder={placeholder}
                           error={(errors && Object.keys(errors).length > 0) || false}/>
                {dropButton}
                {addButton}
                {deleteButton}
            </div>
            {itemChips}
        </div>
    );
}

export default EmbedsManyControl;
