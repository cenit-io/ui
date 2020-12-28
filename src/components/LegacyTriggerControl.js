import React, { useCallback, useEffect, useRef } from 'react';
import { useSpreadState } from "../common/hooks";
import { switchMap } from "rxjs/operators";
import { DataType } from "../services/DataTypeService";
import { of } from "rxjs";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import AddIcon from "@material-ui/icons/AddCircleOutline";
import MenuItem from "@material-ui/core/MenuItem";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import TrashIcon from "@material-ui/icons/Delete";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import Divider from "@material-ui/core/Divider";
import AutosizeInput from 'react-input-autosize';
import { KeyboardDateTimePicker } from "@material-ui/pickers";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { Key } from "../common/Symbols";
import Random from "../util/Random";

const Operation = {
    like: 'Contains',
    is: 'Is exactly',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    _not_null: 'Is present',
    _null: 'Is blank',
    _change: 'Changes',
    _presence_change: 'Present & Changes',
    between: 'Is between',
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This week',
    last_week: 'Last week'
};

const DefaultOperations = ['_not_null', '_null', '_change', '_presence_change'];

function defaultOperationsWith(props) {
    const handleClick = op => () => props.onClick(op);
    return DefaultOperations.map(op => (
        <MenuItem key={`operation_${op}`} onClick={handleClick(op)}>
            {Operation[op]}
        </MenuItem>
    ));
}

const StringOperations = ['like', 'is', 'starts_with', 'ends_with'];

function StringCondition({ value, disabled, onChange }) {

    const [state, setState] = useSpreadState({
        condition: value
    });

    const { condition, menuAnchor } = state;

    const handleClick = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const setCondition = condition => {
        setState({ condition, menuAnchor: null });
        onChange(condition);
    };

    const setValue = v => setCondition({ ...condition, v });

    const selectOperation = o => setCondition({ ...condition, o });

    const setOperation = o => setCondition({ o });

    const strOperations = StringOperations.map(op => (
        <MenuItem key={`operator_${op}`} onClick={() => selectOperation(op)}>
            {Operation[op]}
        </MenuItem>
    ));

    let input;
    if (StringOperations.indexOf(condition.o) !== -1) {
        input = <AutosizeInput value={condition.v || ''}
                               placeholder="?"
                               onChange={({ target }) => setValue(target.value)}
                               disabled={disabled}/>;
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operation[condition.o]}
            </Button>
            {input}
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                {strOperations}
                <Divider/>
                {
                    defaultOperationsWith({
                        onClick: setOperation
                    })
                }
            </Menu>
        </>
    );
}

const useEnumStyles = makeStyles(theme => ({
    root: {
        '& .MuiAutocomplete-endAdornment': {
            top: theme.spacing(-1)
        }
    }
}));

function EnumCondition({ value, disabled, onChange, property }) {

    const [state, setState] = useSpreadState({
        condition: value,
        options: []
    });

    const classes = useEnumStyles();

    const { condition, menuAnchor, options } = state;

    useEffect(() => {
        setState({
            options: property.propertySchema.enum.map(name => ({ name }))
        });
    }, [property]);

    const handleClick = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const selectOperation = o => {
        const condition = { o };
        setState({ condition, menuAnchor: null, autocomplete: false });
        onChange(condition);
    };

    const selectValue = v => {
        v = v.map(({ name }) => name);
        const condition = { v };
        setState({ condition, menuAnchor: null });
        onChange(condition);
    };

    let values;
    if (options.length && !condition.o) {
        let defaultValues = [condition.v].flat(1);
        defaultValues = options.filter(({ name }) => defaultValues.indexOf(name) !== -1);
        values = <Autocomplete multiple
                               className={classes.root}
                               options={options}
                               getOptionLabel={({ name }) => name}
                               value={defaultValues}
                               filterSelectedOptions
                               disableClearable
                               renderInput={(params) => (
                                   <TextField {...params}/>
                               )}
                               onChange={(_, value) => selectValue(value)}
                               disabled={disabled}/>
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operation[condition.o] || 'Value is'}
            </Button>
            {values}
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                <MenuItem onClick={() => setState({ condition: {}, menuAnchor: null })}>Value</MenuItem>
                <Divider/>
                {
                    defaultOperationsWith({ onClick: selectOperation })
                }
            </Menu>
        </>
    );
}

function BooleanCondition({ value, disabled, onChange }) {

    const [state, setState] = useSpreadState({
        condition: value
    });

    const { condition, menuAnchor } = state;

    const handleClick = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const selectOperation = o => {
        const condition = { o };
        setState({ condition, menuAnchor: null });
        onChange(condition);
    };

    const selectValue = v => {
        const condition = { v };
        setState({ condition, menuAnchor: null });
        onChange(condition);
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operation[condition.o] || `Is ${condition.v}`}
            </Button>
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                <MenuItem onClick={() => selectValue('true')}>True</MenuItem>
                <MenuItem onClick={() => selectValue('false')}>False</MenuItem>
                <Divider/>
                {
                    defaultOperationsWith({ onClick: selectOperation })
                }
            </Menu>
        </>
    );
}

const useConditionStyles = makeStyles(theme => ({
    and: {
        margin: theme.spacing(0, 1)
    },
    disabled: {
        color: theme.palette.text.disabled
    }
}));

function NumberCondition({ value, disabled, onChange }) {

    const [state, setState] = useSpreadState({
        condition: value
    });

    const classes = useConditionStyles();

    const { condition, menuAnchor } = state;

    const handleClick = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const setCondition = condition => {
        setState({ condition, menuAnchor: null });
        onChange(condition);
    };

    const merge = v => {
        const current = condition.v || ['', '', ''];
        v.forEach((item, index) => v[index] = (item === undefined) ? current[index] : item);
        return v;
    };

    const setValue = v => setCondition({ ...condition, v: merge(v) });

    const selectOperation = o => setCondition({ ...condition, o });

    const setNumberOperation = (o, v) => setCondition({ o, v: merge(v) });

    let inputs;
    if (condition.o === 'default') {
        inputs = <AutosizeInput value={condition.v[0] || ''}
                                placeholder="?"
                                onChange={({ target }) => setValue([target.value, '', ''])}
                                disabled={disabled}
                                type="number"/>;
    } else if (condition.o === 'between') {
        inputs = (
            <>
                <AutosizeInput value={condition.v[1] || ''}
                               placeholder="-∞"
                               onChange={({ target }) => setValue(['', target.value, undefined])}
                               disabled={disabled}
                               type="number"/>
                <span className={clsx(classes.and, disabled && classes.disabled)}>AND</span>
                <AutosizeInput value={condition.v[2] || ''}
                               placeholder="∞"
                               onChange={({ target }) => setValue(['', undefined, target.value])}
                               disabled={disabled}
                               type="number"/>
            </>
        );
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operation[condition.o] || 'Is number'}
            </Button>
            {inputs}
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                <MenuItem onClick={() => setNumberOperation('default', [undefined, '', ''])}>
                    Number
                </MenuItem>
                <MenuItem onClick={() => setNumberOperation('between', ['', undefined, undefined])}>
                    Between
                </MenuItem>
                <Divider/>
                {
                    defaultOperationsWith({
                        onClick: o => setCondition({ o })
                    })
                }
            </Menu>
        </>
    );
}

const UnaryDateOperator = ['today', 'yesterday', 'this_week', 'last_week'];

const stringifyDate = date => (date && !isNaN(date.getDate()) && date.toISOString()) || '';

function DateCondition({ value, disabled, onChange }) {

    const [state, setState] = useSpreadState({
        condition: value
    });

    const classes = useConditionStyles();

    const { condition, menuAnchor } = state;

    const handleClick = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const setCondition = condition => {
        setState({ condition, menuAnchor: null });
        onChange(condition);
    };

    const merge = v => {
        const current = condition.v || ['', '', ''];
        v.forEach((item, index) => v[index] = (item === undefined) ? current[index] : item);
        return v;
    };

    const setValue = v => setCondition({ ...condition, v: merge(v) });

    const selectOperation = o => setCondition({ ...condition, o });

    const setNumberOperation = (o, v) => setCondition({ o, v: merge(v) });

    const setOperation = o => () => setCondition({ o });

    const unaryDateOperatios = UnaryDateOperator.map(op => (
        <MenuItem key={`operator_${op}`} onClick={setOperation(op)}>
            {Operation[op]}
        </MenuItem>
    ));

    let inputs;
    if (condition.o === 'default') {
        inputs = <KeyboardDateTimePicker value={condition.v[0] || null}
                                         onChange={date => setValue([stringifyDate(date), '', ''])}
                                         disabled={disabled}
                                         placeholder={condition.v[0] ? null : '?'}
                                         format="yyyy/MM/dd HH:mm"
                                         variant="inline"/>
    } else if (condition.o === 'between') {
        inputs = (
            <>
                <KeyboardDateTimePicker value={condition.v[1] || null}
                                        onChange={date => setValue(['', stringifyDate(date), undefined])}
                                        disabled={disabled}
                                        placeholder={condition.v[1] ? null : '-∞'}
                                        format="yyyy/MM/dd HH:mm"
                                        variant="inline"/>
                <span className={clsx(classes.and, disabled && classes.disabled)}>AND</span>
                <KeyboardDateTimePicker value={condition.v[2] || null}
                                        onChange={date => setValue(['', undefined, stringifyDate(date)])}
                                        disabled={disabled}
                                        placeholder={condition.v[2] ? null : '∞'}
                                        format="yyyy/MM/dd HH:mm"
                                        variant="inline"/>
            </>
        );
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operation[condition.o] || 'Is date'}
            </Button>
            {inputs}
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                <MenuItem onClick={() => setNumberOperation('default', [undefined, '', ''])}>
                    Date
                </MenuItem>
                <MenuItem onClick={() => setNumberOperation('between', ['', undefined, undefined])}>
                    Between
                </MenuItem>
                {unaryDateOperatios}
                <Divider/>
                {
                    defaultOperationsWith({
                        onClick: o => setCondition({ o })
                    })
                }
            </Menu>
        </>
    );
}

function conditionControlFor(property) {
    switch (property.type) {
        case 'integer':
        case 'number':
            return NumberCondition;
        case 'boolean':
            return BooleanCondition;
        case 'string': {
            if (property.propertySchema.enum) {
                return EnumCondition;
            }
            if (
                property.propertySchema.format === 'date' ||
                property.propertySchema.format === 'date-time' ||
                property.propertySchema.format === 'time'
            ) {
                return DateCondition;
            }
        }
        default:
            return StringCondition;
    }
}

const useSelectorStyles = makeStyles(theme => ({
    selector: {
        padding: theme.spacing(1),
        border: `solid 1px ${theme.palette.text.disabled}`,
        borderRadius: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(1)
    }
}));

function PropertySelector({ property, value, onDelete, disabled, onChange }) {

    const classes = useSelectorStyles();

    const TrashButton = !disabled && (
        <IconButton size="small"
                    onClick={onDelete}
                    disabled={disabled}>
            <TrashIcon/>
        </IconButton>
    );

    const Condition = conditionControlFor(property);

    return (
        <div className={clsx('flex wrap align-items-center', classes.selector)}>
            {TrashButton}
            <Chip label={property.name}/>
            <Condition key={value[Key]}
                       value={value}
                       disabled={disabled}
                       onChange={onChange}
                       property={property}/>
        </div>
    );
}

function defaultConditionFor(property) {
    switch (property.type) {
        case 'integer':
        case 'number':
            return { o: 'default', v: ['', '', ''] };
        case 'boolean':
            return { v: 'true' };
        case 'string': {
            if (property.propertySchema.enum) {
                return {};
            }
            if (
                property.propertySchema.format === 'date' ||
                property.propertySchema.format === 'date-time' ||
                property.propertySchema.format === 'time'
            ) {
                return { o: 'default', v: ['', '', ''] };
            }

            return { o: 'like' };
        }
        default:
            return {};
    }
}

const useStyles = makeStyles(theme => ({
    selectors: {
        marginBottom: theme.spacing(2)
    },
    error: {
        color: theme.palette.error.main
    }
}));

export default function LegacyTriggerControl({ title, property, value, disabled, readOnly, onChange, errors }) {

    const [state, setState] = useSpreadState({
        triggers: {}
    });

    const dataTypeId = useRef();

    const classes = useStyles();

    const { props, menuAnchor, triggers } = state;

    const setTriggers = useCallback((triggers, state) => {
        setState({ triggers, ...state });
        triggers = JSON.stringify(triggers);
        value.set(triggers);
        onChange(triggers);
    }, [value, onChange]);

    useEffect(() => {
        const subscription = value.changed().subscribe(
            triggers => {
                triggers = (triggers || '').trim();
                triggers = (triggers && JSON.parse(triggers)) || {};
                setState({ triggers });
            }
        );

        value.changed().next(value.get());

        return () => subscription.unsubscribe();
    }, [value]);

    useEffect(() => {
        const subscription = value.parent.changed().pipe(
            switchMap(({ data_type }) => {
                if (data_type?.id !== dataTypeId.current) {
                    if (dataTypeId.current) {
                        setTimeout(() => {
                            value.set('{}', true);
                            setState({ triggers: {} });
                        });
                    }
                    dataTypeId.current = data_type?.id;
                    if (dataTypeId.current) {
                        return DataType.getById(dataTypeId.current);
                    }
                }

                return of(null);
            }),
            switchMap(dt => (dt && dt.queryProps()) || of(null))
        ).subscribe(
            props => {
                if (props || !dataTypeId.current) {
                    setState({ props });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [value]);

    const handleAdd = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const deleteSelector = (name, index) => () => {
        const newTriggers = { ...triggers };
        newTriggers[name].splice(index, 1);
        if (!newTriggers[name].length) {
            delete newTriggers[name];
        }
        setTriggers(newTriggers);
    };

    const changeSelector = (name, index) => cond => {
        const newTriggers = { ...triggers };
        cond[Key] = newTriggers[name][index][Key];
        newTriggers[name][index] = cond;
        setTriggers(newTriggers);
    };

    const addSelector = prop => () => {
        const newTriggers = { ...triggers };
        if (!newTriggers[prop.name]) {
            newTriggers[prop.name] = [];
        }
        newTriggers[prop.name].push(defaultConditionFor(prop));
        setTriggers(newTriggers, { menuAnchor: null });
    };

    const selectorOptions = (props || []).map(prop => (
        <MenuItem key={`prop_${prop.name}`} onClick={addSelector(prop)}>
            {prop.name}
        </MenuItem>
    ));

    const selectors = Object.keys(triggers).map(key => {
        const prop = (props || []).find(({ name }) => name === key);
        if (prop) {
            return triggers[key].map((cond, index) => {
                if (!cond[Key]) {
                    cond[Key] = Random.string();
                }
                return <PropertySelector key={cond[Key]}
                                         property={prop}
                                         value={cond}
                                         disabled={disabled || readOnly}
                                         onDelete={deleteSelector(prop.name, index)}
                                         onChange={changeSelector(prop.name, index)}/>
            });
        }
    }).filter(s => s).flat();

    return (
        <div>
            <div className={clsx('flex wrap', classes.selectors)}>
                {selectors}
            </div>
            <Button className={clsx(errors?.length && classes.error)} startIcon={<AddIcon/>}
                    disabled={disabled || readOnly || !props}
                    onClick={handleAdd}>
                Add trigger
            </Button>
            <Menu onClose={handleClose}
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}>
                {selectorOptions}
            </Menu>
        </div>
    )
}
