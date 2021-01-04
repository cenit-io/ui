import React, { useCallback, useEffect, useRef, useState } from 'react';
import makeStyles from "@material-ui/core/styles/makeStyles";
import { useSpreadState } from "../common/hooks";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { DateTimePicker, TimePicker } from "@material-ui/pickers";
import { addMonths } from 'date-fns'
import Select from "@material-ui/core/Select";
import AutosizeInput from 'react-input-autosize';
import withStyles from "@material-ui/core/styles/withStyles";
import InputBase from "@material-ui/core/InputBase";
import clsx from "clsx";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";
import Typography from "@material-ui/core/Typography";
import Collapsible from "./Collapsible";
import Random from "../util/Random";

const PlainInput = withStyles((theme) => ({
    input: {
        border: 'none',
    },
}))(InputBase);

function OptionButton({ options, disabled, readOnly, className }) {
    const [state, setState] = useSpreadState({
        option: options.find(({ defaultOption }) => defaultOption) || options[0]
    });

    const { option, menuAnchor } = state;

    const handleClick = ({ target }) => !readOnly && setState({ menuAnchor: target });

    const selectOption = op => () => {
        if (op && op !== option) {
            setState({
                option: op,
                menuAnchor: null
            });
            op.action();
        } else {
            setState({ menuAnchor: null });
        }
    };

    const optionsItems = options.map((op, index) => (
        <MenuItem key={String(index)} onClick={selectOption(op)}>
            {op.title}
        </MenuItem>
    ));

    return (
        <>
            <Button disabled={disabled}
                    onClick={handleClick}
                    className={className}>
                {option.title}
            </Button>
            <Menu onClose={selectOption(null)}
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}>
                {optionsItems}
            </Menu>
        </>
    );
}

const useStyles = makeStyles(theme => ({
    marginRight: {
        marginRight: theme.spacing(1)
    },
    marginTop: {
        marginTop: theme.spacing(1)
    },
    period: {
        padding: theme.spacing(3, 0)
    },
    word: {
        textTransform: 'uppercase',
        padding: theme.spacing(0, .5)
    },
    day: {
        minWidth: theme.spacing(4)
    }
}));

export default function SchedulerExpressionControl({ title, property, value, disabled, readOnly, onChange, errors }) {

    const [state, setState] = useSpreadState({
        expression: {}
    });

    const key = useRef(Random.string());

    const classes = useStyles();

    const { menuAnchor, expression } = state;

    const setExpression = useCallback((expression, state) => {
        setState({ expression, ...state });
        value.set(expression);
        onChange(expression);
    }, [value, onChange]);

    useEffect(() => {
        const subscription = value.changed().subscribe(
            exp => {
                setExpression(exp);
                key.current = Random.string();
            }
        );

        return () => subscription.unsubscribe();
    }, [value, setExpression]);

    const switchTo = type => () => {
        if (expression.type !== type) {
            const newExp = { ...expression };
            Object.keys(expression).forEach(key => {
                if (key !== 'start_at' && key !== 'end_at') {
                    delete newExp[key];
                }
            });
            newExp.type = type;
            if (type === 'appointed') {
                const now = new Date();
                newExp.hours = [now.getHours()];
                newExp.minutes = [now.getMinutes()];
            }
            setExpression(newExp);
        }
    };

    const startOptions = [
        {
            title: 'Starting immediately',
            action: () => {
                const exp = { ...expression };
                delete exp.start_at;
                setExpression(exp);
            }
        },
        {
            title: "Starting at",
            action: () => {
                const exp = { ...expression, start_at: new Date() };
                setExpression(exp);
            },
            defaultOption: expression.start_at
        }
    ];

    const repeatOptions = [
        {
            title: 'Repeat every',
            action: switchTo('cyclic'),
        },
        {
            title: 'Repeat at',
            action: switchTo('appointed'),
            defaultOption: expression.type === 'appointed'
        }
    ];

    const endOptions = [
        {
            title: 'Indefinitely',
            action: () => {
                const exp = { ...expression };
                delete exp.end_at;
                setExpression(exp);
            }
        },
        {
            title: "Ending at",
            action: () => {
                const exp = { ...expression, end_at: addMonths(new Date(), 1) };
                setExpression(exp);
            },
            defaultOption: expression.end_at
        }
    ];

    let startAt;
    if (expression.start_at) {
        startAt = <DateTimePicker value={expression.start_at}
                                  format="yyyy/MM/dd HH:mm"
                                  onChange={start_at => setExpression({ ...expression, start_at })}
                                  disabled={disabled}
                                  readOnly={readOnly}/>
    }

    let endAt;
    if (expression.end_at) {
        endAt = <DateTimePicker value={expression.end_at}
                                format="yyyy/MM/dd HH:mm"
                                onChange={end_at => setExpression({ ...expression, end_at })}
                                disabled={disabled}
                                readOnly={readOnly}/>
    }

    let period, periodEx;
    if (expression.type === 'appointed') {
        const time = new Date();
        time.setHours(expression.hours[0], expression.minutes[0]);

        period = <TimePicker ampm={false}
                             value={time}
                             onChange={date => setExpression({
                                 ...expression,
                                 hours: [date.getHours()],
                                 minutes: [date.getMinutes()]
                             })}
                             disabled={disabled}
                             readOnly={readOnly}/>;

        const monthWeeks = [...(expression.weeks_month || [])];
        if (expression.last_week_in_month) {
            monthWeeks.push('Last');
        }
        const weekDays = (
            <Collapsible title="on week days"
                         variant="button"
                         defaultCollapsed={!expression.weeks_days?.length}>
                <ToggleButtonGroup value={expression.weeks_days || []}
                                   onChange={(_, weeks_days) => !readOnly && setExpression({ ...expression, weeks_days })}
                                   size="small">
                    <ToggleButton value={0} disabled={disabled}>
                        Sun
                    </ToggleButton>
                    <ToggleButton value={1} disabled={disabled}>
                        Mon
                    </ToggleButton>
                    <ToggleButton value={2} disabled={disabled}>
                        Tue
                    </ToggleButton>
                    <ToggleButton value={3} disabled={disabled}>
                        Wed
                    </ToggleButton>
                    <ToggleButton value={4} disabled={disabled}>
                        Thu
                    </ToggleButton>
                    <ToggleButton value={5} disabled={disabled}>
                        Fri
                    </ToggleButton>
                    <ToggleButton value={6} disabled={disabled}>
                        Sat
                    </ToggleButton>
                </ToggleButtonGroup>
                <div className={clsx('flex align-items-center', classes.marginTop)}>
                    <Typography className={clsx(classes.marginRight, classes.word)} variant="button">
                        the
                    </Typography>
                    <ToggleButtonGroup className={classes.marginRight}
                                       value={monthWeeks}
                                       onChange={(_, weeks_month) => {
                                           if (!readOnly) {
                                               const newExpression = { ...expression, weeks_month };
                                               let lastIndex = weeks_month.indexOf('Last');
                                               if (lastIndex !== -1) {
                                                   weeks_month.splice(lastIndex, 1);
                                                   newExpression.last_week_in_month = true;
                                               } else {
                                                   delete newExpression.last_week_in_month;
                                               }
                                               setExpression(newExpression);
                                           }
                                       }}
                                       size="small">
                        <ToggleButton value={0} disabled={disabled}>
                            First
                        </ToggleButton>
                        <ToggleButton value={1} disabled={disabled}>
                            Second
                        </ToggleButton>
                        <ToggleButton value={2} disabled={disabled}>
                            Third
                        </ToggleButton>
                        <ToggleButton value={3} disabled={disabled}>
                            Fourth
                        </ToggleButton>
                        <ToggleButton value={'Last'} disabled={disabled}>
                            Last
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Typography className={classes.word} variant="button">
                        weeks
                    </Typography>
                </div>
            </Collapsible>
        );
        const monthsDays = [...(expression.months_days || [])];
        if (expression.last_day_in_month) {
            monthsDays.push('Last');
        }
        let monthDaysButtons = [0, 1, 2, 3].map(
            row => Array.from(Array(8).keys()).map((_, i) => 8 * row + i + 1)
        );
        monthDaysButtons[3][7] = 'Last';
        monthDaysButtons = monthDaysButtons.map((days, row) => (
            <ToggleButtonGroup key={`days_row_${row}`}
                               value={monthsDays}
                               onChange={ (_, months_days) => {
                                   if (!readOnly) {
                                       const newExpression = { ...expression, months_days };
                                       let lastIndex = months_days.indexOf('Last');
                                       if (lastIndex !== -1) {
                                           months_days.splice(lastIndex, 1);
                                           newExpression.last_day_in_month = true;
                                       } else {
                                           delete newExpression.last_day_in_month;
                                       }
                                       setExpression(newExpression);
                                   }
                               }}
                               size="small">
                {
                    days.map(day => (
                        <ToggleButton key={`day_${day}`} value={day} disabled={disabled}>
                            <div className={classes.day}>
                                {day}
                            </div>
                        </ToggleButton>
                    ))
                }
            </ToggleButtonGroup>
        ));
        monthDaysButtons = (
            <Collapsible title="the month days" variant="button" defaultCollapsed={!monthsDays.length}>
                <div className="flex column">
                    {monthDaysButtons}
                </div>
            </Collapsible>
        );
        periodEx = (
            <div className="flex column">
                {weekDays}
                {monthDaysButtons}
                <Collapsible title="on months" variant="button" defaultCollapsed={!expression.months?.length}>
                    <ToggleButtonGroup value={expression.months || []}
                                       onChange={(_, months) => !readOnly && setExpression({
                                           ...expression,
                                           months
                                       })}
                                       size="small">
                        <ToggleButton value={1} disabled={disabled}>
                            Jan
                        </ToggleButton>
                        <ToggleButton value={2} disabled={disabled}>
                            Feb
                        </ToggleButton>
                        <ToggleButton value={3} disabled={disabled}>
                            Mar
                        </ToggleButton>
                        <ToggleButton value={4} disabled={disabled}>
                            Apr
                        </ToggleButton>
                        <ToggleButton value={5} disabled={disabled}>
                            May
                        </ToggleButton>
                        <ToggleButton value={6} disabled={disabled}>
                            Jun
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <ToggleButtonGroup className={classes.marginRight}
                                       value={expression.months || []}
                                       onChange={(_, months) => !readOnly && setExpression({
                                           ...expression,
                                           months
                                       })}
                                       size="small">
                        <ToggleButton value={7} disabled={disabled}>
                            Jul
                        </ToggleButton>
                        <ToggleButton value={8} disabled={disabled}>
                            Ago
                        </ToggleButton>
                        <ToggleButton value={9} disabled={disabled}>
                            Sep
                        </ToggleButton>
                        <ToggleButton value={10} disabled={disabled}>
                            Oct
                        </ToggleButton>
                        <ToggleButton value={11} disabled={disabled}>
                            Nov
                        </ToggleButton>
                        <ToggleButton value={12} disabled={disabled}>
                            Dec
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Collapsible>
            </div>
        );
    } else if (expression.type === 'cyclic' && expression.cyclic_expression) {
        const cyclexp = expression.cyclic_expression;
        const unit = Math.abs(parseInt(cyclexp.substring(0, cyclexp.length - 1))) || 1;
        const span = cyclexp.substring(cyclexp.length - 1, cyclexp.length);

        const setUnit = e => setExpression({
            ...expression,
            cyclic_expression: `${Math.abs(parseInt(e.target.value)) || 1}${span}`
        });

        const setSpan = e => setExpression({
            ...expression,
            cyclic_expression: `${unit}${e.target.value}`
        });

        period = (
            <div className="flex align-items-center">
                <AutosizeInput value={unit}
                               className={classes.marginRight}
                               onChange={setUnit}
                               type="number"
                               disabled={disabled}
                               readOnly={readOnly}/>
                <Select value={span}
                        onChange={setSpan}
                        input={<PlainInput/>}
                        disabled={disabled}
                        readOnly={readOnly}>
                    <MenuItem value="s">seconds</MenuItem>
                    <MenuItem value="m">minutes</MenuItem>
                    <MenuItem value="h">hours</MenuItem>
                    <MenuItem value="d">days</MenuItem>
                    <MenuItem value="w">weeks</MenuItem>
                    <MenuItem value="M">months</MenuItem>
                </Select>
            </div>
        );
    } else {
        setExpression({
            ...expression,
            type: 'cyclic',
            cyclic_expression: '20m'
        });
    }

    return (
        <div key={key.current}>
            <div className="flex align-items-center">
                <OptionButton options={startOptions}
                              disabled={disabled}
                              readOnly={readOnly}
                              className={classes.marginRight}/>
                {startAt}
            </div>
            <div className={clsx('flex column', classes.period)}>
                <div className="flex">
                    <OptionButton options={repeatOptions}
                                  disabled={disabled}
                                  readOnly={readOnly}
                                  className={classes.marginRight}/>
                    {period}
                </div>
                {periodEx}
            </div>
            <div className="flex">
                <OptionButton options={endOptions}
                              disabled={disabled}
                              readOnly={readOnly}
                              className={classes.marginRight}/>
                {endAt}
            </div>
        </div>
    )
}
