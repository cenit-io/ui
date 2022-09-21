import React, { useEffect } from 'react';
import { IconButton } from "@material-ui/core";
import ClearIcon from '@material-ui/icons/Clear';
import AddIcon from '@material-ui/icons/Add';
import CreateIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import RefPicker from "./RefPicker";
import '../common/FlexBox.css';
import { map } from "rxjs/operators";
import { useSpreadState } from "../common/hooks";
import { FormRootValue } from "../services/FormValue";
import { FETCHED, Title } from "../common/Symbols";
import { ItemChip } from "./ItemChip";
import { useFormContext } from "./FormContext";
import { ReactSortable } from "react-sortablejs";
import Loading from "./Loading";


export default function RefManyControl({
  title, property, value, onChange, onStack, onDelete, disabled, sortDisabled,
  readOnly, config, additionalViewportProps
}) {

  const [state, setState] = useSpreadState();

  const { initialFormValue } = useFormContext();

  const { open, idMapper } = state;

  useEffect(() => {
    const subsciption = property.dataType.getProperty('_id').subscribe(
      p => setState({
        idMapper: p?.type
          ? ({ id }) => id
          : ({ id }) => `$oid#${id}`
      })
    );

    return () => subsciption.unsubscribe();
  }, [property]);

  if (!idMapper) {
    return <Loading />;
  }

  const handlePick = ({ record, title }) => {
    const aValue = [...(value.get() || [])];
    const { id, _type } = record;
    const itemValue = {
      id,
      _reference: true,
      [Title]: title
    };
    if (_type && _type !== property.dataType.type_name()) {
      itemValue._type = _type;
    }
    aValue.push(itemValue);
    onChange(aValue);
    value.set(aValue);
    value.checkPid();
    setState({ open: aValue.length > 0 || open });
  };

  const addNew = () => {
    if (value.get()) {
      const newSeed = config?.newSeed;
      let seed;
      if (newSeed) {
        if (typeof newSeed === 'function') {
          seed = dataType => newSeed(value, dataType);
        } else {
          seed = newSeed;
        }
      }
      onStack({
        value: new FormRootValue({ [FETCHED]: true }),
        seed,
        controlConfig: config?.formConfig,
        typesFilter: config.typesFilter,
        dataType: property.dataType,
        title: itemValue => property.dataType.titleFor(itemValue).pipe(
          map(itemTitle => `[${property.name} #${value.length}] ${itemTitle}`)
        ),
        callback: v => {
          if (v.constructor !== Array) {
            v = [v];
          }
          v.forEach(v => v._reference = true);
          v = [...value.get(), ...v];
          onChange(v);
          value.set(v);
          setOpen(true);
        }
      });
    } else {
      value.set([]);
      onChange(value.cache);
    }
    if (value.get() && value.cache.length > 0) {
      setOpen(true);
    }
    setState({}); // to refresh
  };

  const setOpen = open => setState({ open });

  const handleDelete = index => () => {
    const v = [...value.get()];
    v.splice(index, 1);
    value.set(v);
    onChange(v);
    setState({}); // to refresh
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

  const handleSelect = index => () => {
    onStack({
      value: new FormRootValue({ id: value.indexValue(index).get().id }),
      dataType: property.dataType,
      controlConfig: config?.formConfig,
      title: v => property.dataType.titleFor(v).pipe(map(title => `[${property.name} #${index}] ${title}`)),
      callback: item => property.dataType.titleFor(item).subscribe( //TODO sanitize with unsubscribe
        title => {
          item[Title] = title;
          value.indexValue(index).set(item);
          value.indexValue(index).checkPid();
        }
      ),
      rootId: value.get()[index].id
    });
  };

  const sort = indices => {
    const hash = aValue.reduce((h, item) => (h[item.id] = item) && h, {});
    let modified = false;
    const newValue = indices.map(({ id }, index) => {
      modified = modified || id !== aValue[index].id;
      return hash[id];
    });
    if (modified) {
      value.set(newValue);
      onChange(newValue);
      setState({}); // To refresh
    }
  };

  let dropButton, deleteButton, itemsControls;

  const aValue = value.get();
  if (aValue) {
    if (open) {
      dropButton = aValue.length > 0 &&
        <IconButton onClick={() => setOpen(false)}><ArrowDropUpIcon /></IconButton>;
      itemsControls = aValue.map(
        ({ id }, index) => <ItemChip key={`item_${id}`}
                                     dataType={property.dataType}
                                     item={value.indexValue(index)}
                                     onSelect={handleSelect(index)}
                                     onDelete={(!readOnly && handleDelete(index)) || null}
                                     disabled={disabled}
                                     readOnly={readOnly} />
      );

      if (!readOnly && !disabled && !sortDisabled) {
        itemsControls = (
          <ReactSortable list={aValue.map(({ id }) => ({ id }))}
                         setList={sort}>
            {itemsControls}
          </ReactSortable>
        );
      }
    } else {
      dropButton = aValue.length > 0 &&
        <IconButton onClick={() => setOpen(true)}>
          <ArrowDropDownIcon />
        </IconButton>;
    }
    if (!readOnly && !disabled) {
      deleteButton = <IconButton onClick={handleClear} disabled={disabled}><ClearIcon /></IconButton>;
    }
  }

  let addButton;
  if (!readOnly && !disabled) {
    const AddNewIcon = aValue ? AddIcon : CreateIcon;
    addButton = <IconButton onClick={addNew} disabled={disabled}><AddNewIcon /></IconButton>;
  }

  const itemsText = aValue ? `${aValue.length} items` : '';

  const placeholder = itemsText || String(aValue);

  let selector = config?.selector;
  if (aValue?.length) {
    const ids = {
      _id: { $nin: aValue.map(idMapper) }
    };
    selector = selector
      ? { $and: [selector, ids] }
      : ids
  }

  return (
    <div className='flex column'>
      <div className='flex'>
        <RefPicker dataType={property.dataType}
                   label={title}
                   onPick={handlePick}
                   text={itemsText}
                   placeholder={placeholder}
                   disabled={disabled}
                   readOnly={readOnly || !aValue}
                   baseSelector={selector}
                   additionalViewportProps={additionalViewportProps} />
        {dropButton}
        {addButton}
        {deleteButton}
      </div>
      <div className='flex wrap' style={{ paddingTop: '10px' }}>
        {itemsControls}
      </div>
    </div>
  );
}
