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


function EmbedsManyControl({ title, value, property, errors, onDelete, onChange, schema, disabled, onStack, readOnly, ready }) {

    const [state, setState] = useSpreadState({
        open: false,
        selectedIndex: -1
    });
    const indexed = useRef(false);

    const { initialFormValue } = useFormContext();

    const setOpen = open => setState({ open });
    const setSelectedIndex = selectedIndex => setState({ selectedIndex });

    const controlPropertyRef = useRef(new Property({
        dataType: property.dataType,
        propertySchema: schema
    }));

    const { open, selectedIndex } = state;

    const eValue = value.get();
    const controlProperty = controlPropertyRef.current;

    useEffect(() => {
        if (ready && !indexed.current) {
            indexed.current = true;
            if (eValue) {
                eValue.forEach((item, index) => item[INDEX] = index);
            }
        }
    }, [eValue, ready]);


    const addNew = () => {
        let eValue = value.get();
        if (eValue) {
            value.set(eValue = [...eValue, {
                [NEW]: true,
                [FETCHED]: true
            }]);
        } else {
            eValue = [];
        }
        setSelectedIndex(eValue.length - 1);
        if (eValue.length > 0) {
            setOpen(true);
        }
        value.set(eValue);
        setState({}); // to refresh
        onChange(eValue);
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
        setState({}); // for refresh
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
        setState({}); // to refresh
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

    if (eValue) {
        if (open) {
            itemChips = eValue.map(
                (item, index) => {
                    if (!item[Key]) {
                        item[Key] = Random.string();
                    }

                    return <ItemChip key={`item_${index}`}
                                     dataType={property.dataType}
                                     item={value.indexValue(index)}
                                     onSelect={selectItem(index)}
                                     onDelete={deleteItem(index)}
                                     selected={selectedIndex === index}
                                     disabled={disabled}
                                     readOnly={readOnly}/>;
                }
            );

            dropButton = !readOnly && eValue.length > 0 &&
                <IconButton onClick={() => setOpen(false)} disabled={disabled}>
                    <ArrowDropUpIcon/>
                </IconButton>;

            let itemControl;

            if (selectedIndex !== -1) {
                controlProperty.jsonKey = controlProperty.name = selectedIndex;
                itemControl = (
                    <ObjectControl property={controlProperty}
                                   fetchPath={`${value.jsonPath()}[${eValue[selectedIndex][INDEX]}]`}
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
            dropButton = eValue.length > 0 &&
                <IconButton onClick={() => setOpen(true)} disabled={disabled}>
                    <ArrowDropDownIcon/>
                </IconButton>;
        }
        if (!readOnly) {
            deleteButton = <IconButton onClick={handleClear} disabled={disabled}><ClearIcon/></IconButton>;
        }
    }

    let addButton;
    if (!readOnly) {
        const AddNewIcon = eValue ? AddIcon : CreateIcon;
        addButton = <IconButton onClick={addNew} disabled={disabled}><AddNewIcon/></IconButton>;
    }

    const itemsCount = eValue ? `${eValue.length} items` : '';

    const placeholder = itemsCount || String(eValue) || itemsCount;

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
