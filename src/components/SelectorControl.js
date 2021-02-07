import React, { useCallback, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import AddIcon from "@material-ui/icons/AddCircleOutline";
import MenuItem from "@material-ui/core/MenuItem";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import TrashIcon from "@material-ui/icons/Delete";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import AutosizeInput from 'react-input-autosize';
import { KeyboardDateTimePicker } from "@material-ui/pickers";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import Skeleton from "@material-ui/lab/Skeleton";
import useTheme from "@material-ui/core/styles/useTheme";
import CheckIcon from "../icons/CheckIcon";
import FalseIcon from "../icons/FalseIcon";
import Select from "@material-ui/core/Select";
import ClearIcon from "@material-ui/icons/Clear";

const Operators = {
    $eq: 'Equal',
    $ne: 'Not equal',
    $gt: 'Greater than',
    $gte: 'Greater than or equal',
    $lt: 'Less than',
    $lte: 'Less than or equal',
    $in: 'Is in',
    $nin: 'Is not in',
    $exists: 'Exists',
    $regex: 'Is like'
};

const useSelectorStyles = makeStyles(theme => ({
    selector: {
        padding: theme.spacing(1),
        border: `solid 1px ${theme.palette.text.disabled}`,
        borderRadius: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(1)
    },
    checked: {
        color: `${theme.palette.success.main} !important`
    },
    unchecked: {
        color: `${theme.palette.error.main} !important`
    }
}));

function ValueCondition({ property, operators, valueControl, operator, value, field, disabled, onChange }) {

    const [state, setState] = useSpreadState({});

    const classes = useSelectorStyles();

    const { menuAnchor } = state;

    const handleClose = () => setState({ menuAnchor: null });

    const options = operators.filter(op => !field.hasOwnProperty(op)).map(
        op => (
            <MenuItem key={op} onClick={() => onChange({ [op]: value })}>
                {Operators[op]}
            </MenuItem>
        )
    );

    const handleClick = options.length
        ? ({ target }) => setState({ menuAnchor: target })
        : undefined;

    let v;

    if (operator === '$exists') {
        const bValue = Boolean(value);
        const Icon = bValue ? CheckIcon : FalseIcon;
        if (bValue !== value) {
            setTimeout(() => onChange({ [operator]: bValue }));
        }
        v = (
            <>
                <span>{JSON.stringify(bValue).toUpperCase()}</span>
                <IconButton className={bValue ? classes.checked : classes.unchecked}
                            onClick={() => onChange({ [operator]: !value })}>
                    <Icon/>
                </IconButton>
            </>
        )
    } else {
        const ValueControl = valueControl;
        v = <ValueControl property={property}
                          operator={operator}
                          value={value}
                          onChange={onChange}
                          disabled={disabled}/>;
    }

    return (
        <>
            <Button onClick={handleClick} disabled={disabled}>
                {Operators[operator]}
            </Button>
            {v}
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                {options}
            </Menu>
        </>
    );
}

const StringOperators = [
    '$regex',
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$exists'
];

function StringValue({ operator, value, onChange, disabled }) {
    const strValue = (value === null && (operator === '$eq' || operator === '$ne'))
        ? null :
        (value || '').toString();
    if (strValue !== null && strValue !== value) {
        setTimeout(() => onChange({ [operator]: strValue }));
    }
    let clear;
    if (strValue !== null && (operator === '$eq' || operator === '$ne')) {
        clear = (
            <IconButton size="small" onClick={() => onChange({ [operator]: null })}>
                <ClearIcon/>
            </IconButton>
        );
    }
    return (
        <>
            <AutosizeInput key={strValue ? 'key' : 'null'}
                           value={strValue || ''}
                           onChange={({ target }) => onChange({
                               [operator]: target.value
                           })}
                           disabled={disabled}
                           placeholder={strValue === null ? 'null' : ''}
                           autoFocus={true}/>
            {clear}
        </>
    );
}

function StringCondition({ field, operator, value, onChange, disabled, property }) {
    return (
        <ValueCondition valueControl={StringValue}
                        operators={StringOperators}
                        operator={operator}
                        value={value}
                        onChange={onChange}
                        field={field}
                        property={property}
                        disabled={disabled}/>
    );
}

const useEnumStyles = makeStyles(theme => ({
    root: {
        '& .MuiAutocomplete-endAdornment': {
            top: theme.spacing(-1)
        }
    }
}));

const EnumOperators = [
    '$in',
    '$nin',
    '$exists'
];

function EnumValue({ operator, value, onChange, disabled, property }) {
    const classes = useEnumStyles();
    if (typeof value !== 'object') {
        value = [];
        setTimeout(() => onChange({ [operator]: [] }))
    }
    const options = property.propertySchema.enum.map(name => ({ name }));
    const defaultValues = options.filter(({ name }) => value.includes(name));
    return (
        <Autocomplete multiple
                      className={classes.root}
                      options={options}
                      getOptionLabel={({ name }) => name}
                      value={defaultValues}
                      filterSelectedOptions
                      disableClearable
                      renderInput={(params) => (
                          <TextField {...params}/>
                      )}
                      onChange={(_, value) => onChange({ [operator]: value.map(({ name }) => name) })}
                      disabled={disabled}/>
    );
}

function EnumCondition({ property, operator, value, disabled, onChange, field }) {
    return (
        <ValueCondition valueControl={EnumValue}
                        operators={EnumOperators}
                        operator={operator}
                        value={value}
                        onChange={onChange}
                        field={field}
                        property={property}
                        disabled={disabled}/>
    );
}

const BooleanOperators = [
    '$eq',
    '$ne',
    '$exists'
];

function BooleanValue({ operator, value, onChange, disabled }) {
    return (
        <Select value={JSON.stringify(value)}
                onChange={({ target }) => onChange({ [operator]: JSON.parse(target.value) })}
                disabled={disabled}>
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
            <MenuItem value="null">null</MenuItem>
        </Select>
    );
}

function BooleanCondition({ operator, value, disabled, onChange, field }) {
    return (
        <ValueCondition valueControl={BooleanValue}
                        operators={BooleanOperators}
                        operator={operator}
                        value={value}
                        onChange={onChange}
                        field={field}
                        disabled={disabled}/>
    );
}

const NumberOperators = [
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$exists'
];

function NumberValue({ operator, value, onChange, disabled }) {
    const iValue = (value === null && (operator === '$eq' || operator === '$ne'))
        ? null :
        parseInt(value || 0);
    if (iValue !== null && iValue !== value) {
        setTimeout(() => onChange({ [operator]: isNaN(iValue) ? 0 : iValue }));
    }
    let clear;
    if (iValue !== null && (operator === '$eq' || operator === '$ne')) {
        clear = (
            <IconButton size="small" onClick={() => onChange({ [operator]: null })}>
                <ClearIcon/>
            </IconButton>
        );
    }
    return (
        <>
            <AutosizeInput value={value === null ? '' : value}
                           onChange={({ target }) => onChange({
                               [operator]: target.value ? parseInt(target.value) : null
                           })}
                           disabled={disabled}
                           placeholder="null"
                           type="number"/>
            {clear}
        </>);
}

function NumberCondition({ operator, value, field, disabled, onChange }) {
    return (
        <ValueCondition valueControl={NumberValue}
                        operators={NumberOperators}
                        operator={operator}
                        value={value}
                        onChange={onChange}
                        field={field}
                        disabled={disabled}/>
    );
}

const DateOperators = [
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$exists'
];

const stringifyDate = date => (date && !isNaN(date.getDate()) && date.toISOString()) || '';

function DateValue({ operator, value, onChange, disabled }) {
    const dateValue = (value === null && (operator === '$eq' || operator === '$ne'))
        ? null :
        (value || new Date().toISOString()).toString();
    if (dateValue !== null && dateValue !== value) {
        setTimeout(() => onChange({ [operator]: dateValue }));
    }
    let clear;
    if (dateValue !== null && (operator === '$eq' || operator === '$ne')) {
        clear = (
            <IconButton size="small" onClick={() => onChange({ [operator]: null })}>
                <ClearIcon/>
            </IconButton>
        );
    }
    return (
        <>
            <KeyboardDateTimePicker value={dateValue}
                                    onChange={date => onChange({
                                        [operator]: date ? stringifyDate(date) : null
                                    })}
                                    disabled={disabled}
                                    format="yyyy/MM/dd HH:mm"
                                    variant="inline"/>
            {clear}
        </>);
}

function DateCondition({ field, operator, value, disabled, onChange }) {
    return (
        <ValueCondition valueControl={DateValue}
                        operators={DateOperators}
                        operator={operator}
                        value={value}
                        onChange={onChange}
                        field={field}
                        disabled={disabled}/>
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

function PropertyCondition({ property, operator, field, value, onDelete, disabled, onChange }) {

    const [state, setState] = useSpreadState({});

    const classes = useSelectorStyles();

    const { menuAnchor } = state;

    const handleClose = () => setState({ menuAnchor: null });

    const TrashButton = !disabled && (
        <IconButton size="small"
                    onClick={onDelete}
                    disabled={disabled}>
            <TrashIcon/>
        </IconButton>
    );

    const options = Object.keys(Operators).filter(op => !field.hasOwnProperty(op)).map(
        op => (
            <MenuItem key={op} onClick={() => onChange({ [op]: value })}>
                {Operators[op]}
            </MenuItem>
        )
    );

    const Condition = conditionControlFor(property);

    return (
        <div className={clsx('flex wrap align-items-center', classes.selector)}>
            {TrashButton}
            <Chip label={property.name}/>
            <Condition property={property}
                       field={field}
                       operator={operator}
                       value={value}
                       onChange={onChange}/>
            <Menu open={Boolean(menuAnchor)}
                  anchorEl={menuAnchor}
                  onClose={handleClose}>
                {options}
            </Menu>
        </div>
    );
}

function defaultConditionFrom(operators, current, defaultValue) {
    const op = operators.find(op => !current.hasOwnProperty(op)) || operators[0];
    const value = op === '$exists' ? false : current[op] || defaultValue;
    return { [op]: value };
}

function defaultConditionFor(property, current) {
    switch (property.type) {
        case 'integer':
        case 'number':
            return defaultConditionFrom(NumberOperators, current, 0);
        case 'boolean':
            return defaultConditionFrom(BooleanOperators, current, true);
        case 'string': {
            if (property.propertySchema.enum) {
                return defaultConditionFrom(EnumOperators, current, []);
            }
            if (
                property.propertySchema.format === 'date' ||
                property.propertySchema.format === 'date-time' ||
                property.propertySchema.format === 'time'
            ) {
                return defaultConditionFrom(DateOperators, current, new Date().toISOString());
            }

            return defaultConditionFrom(StringOperators, current, property.name);
        }
        default:
            return defaultConditionFrom(StringOperators, current, property.name);
    }
}

const useStyles = makeStyles(theme => ({
    selectors: {
        marginBottom: theme.spacing(2)
    },
    error: {
        color: theme.palette.error.main
    },
    skeleton: {
        padding: theme.spacing(1),
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(1)
    }
}));

export default function SelectorControl({ title, dataType, value, disabled, readOnly, onChange, errors }) {

    const [state, setState] = useSpreadState({
        selector: {}
    });

    const classes = useStyles();

    const theme = useTheme();

    const { props, menuAnchor, selector } = state;

    const setSelector = useCallback((selector, state) => {
        setState({ selector, ...state });
        value.set(selector);
        onChange && onChange(selector);
    }, [value, onChange]);

    useEffect(() => {
        const subscription = value.changed().subscribe(
            selector => setState({ selector })
        );

        value.changed().next(value.get());

        return () => subscription.unsubscribe();
    }, [value]);

    useEffect(() => {
        const subscription = dataType.queryProps().subscribe(
            props => setState({ props })
        );

        return () => subscription.unsubscribe();
    }, [dataType]);

    const handleAdd = ({ target }) => setState({ menuAnchor: target });

    const handleClose = () => setState({ menuAnchor: null });

    const deleteCondition = (name, operator) => () => {
        const propCondition = { ...selector[name] };
        delete propCondition[operator];
        const newSelector = { ...selector };
        if (Object.keys(propCondition).length) {
            newSelector[name] = propCondition;
        } else {
            delete newSelector[name];
        }
        setSelector(newSelector);
    };

    const changeCondition = (name, operator) => cond => {
        let newSelector = { ...selector };
        delete newSelector[name][operator];
        newSelector[name] = { ...newSelector[name], ...cond };
        setSelector(newSelector);
    };

    const addPropertyCondition = prop => () => {
        const newSelector = { ...selector };
        newSelector[prop.name] = {
            ...newSelector[prop.name],
            ...defaultConditionFor(prop, newSelector[prop.name] || {})
        };
        setSelector(newSelector, { menuAnchor: null });
    };

    let selectorOptions, selectors;
    if (props) {
        selectorOptions = (props || []).map(prop => (
            <MenuItem key={`prop_${prop.name}`} onClick={addPropertyCondition(prop)}>
                {prop.name}
            </MenuItem>
        ));

        selectors = Object.keys(selector).map(field => {
            const prop = (props || []).find(({ name }) => name === field);
            if (prop) {
                const fieldConditions = selector[field];
                const operators = Object.keys(fieldConditions);
                return operators.map(op => (
                    <PropertyCondition key={`${field}_${op}`}
                                       property={prop}
                                       operator={op}
                                       field={fieldConditions}
                                       value={fieldConditions[op]}
                                       disabled={disabled || readOnly}
                                       onDelete={deleteCondition(prop.name, op)}
                                       onChange={changeCondition(prop.name, op)}/>
                ));
            }
        }).filter(s => s).flat();
    } else {
        selectors = Object.keys(selector).map(
            field => Object.keys(selector[field])
        ).flat().map(
            (_, index) => <Skeleton key={`skeleton_${index}`}
                                    variant="text"
                                    height={theme.spacing(4)}
                                    width={theme.spacing(22)}
                                    className={classes.skeleton}/>
        );
    }


    return (
        <div className="flex column align-items-center">
            <div className={clsx('flex wrap justify-content-center', classes.selectors)}>
                {selectors}
            </div>
            <Button className={clsx(errors?.length && classes.error)} startIcon={<AddIcon/>}
                    disabled={disabled || readOnly || !props}
                    onClick={handleAdd}>
                Add condition
            </Button>
            <Menu onClose={handleClose}
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}>
                {selectorOptions}
            </Menu>
        </div>
    )
}
