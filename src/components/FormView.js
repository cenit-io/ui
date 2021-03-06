import React, { useEffect, useRef } from 'react';
import ObjectControl from "./ObjectControl";
import { makeStyles, useTheme } from "@material-ui/core";
import { catchError, switchMap, map } from "rxjs/operators";
import { isObservable, of } from "rxjs";
import zzip from "../util/zzip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import { Skeleton } from "@material-ui/lab";
import ListSubheader from "@material-ui/core/ListSubheader";
import FormContext from "./FormContext";
import { useSpreadState } from "../common/hooks";
import { FETCHED } from "../common/Symbols";
import { CRUD } from "../actions/ActionRegistry";

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: ({ height }) => height ? `calc(${height})` : 'unset',
        width: ({ width }) => width ? `calc(${width})` : 'unset',
        overflow: 'auto'
    },
    bgPaper: {
        background: theme.palette.background.paper
    }
}));

const FormView = ({
                      rootId, submitter, viewport, dataType, width, height, value, _type,
                      disabled, onStack, readOnly, onFormSubmit, onUpdate, seed, typesFilter
                  }) => {

    const [state, setState] = useSpreadState({
        initialFormValue: value.get()[FETCHED] ? value.cache : {}
    });
    const classes = useStyles();
    const theme = useTheme();

    const seeded = useRef(false);

    const {
        formDataType, dataTypeConfig, errors, initialFormValue,
        descendants, titles, descendantsCount, configs, configProps
    } = state;

    useEffect(() => {
        let subscription;
        if (rootId) {
            if (_type && _type !== dataType.type_name()) {
                subscription = dataType.descendants().pipe(
                    map(
                        descendants => descendants.find(d => d.type_name() === _type)
                    )
                ).subscribe(formDataType => setState({ formDataType }));
            } else {
                setState({ formDataType: dataType });
            }
        } else {
            subscription = zzip(
                dataType.isAbstract(),
                dataType.descendantsCount()
            ).pipe(
                switchMap(([abstract, descendantsCount]) => {
                    if (abstract) {
                        setState({ descendantsCount });
                        return dataType.descendants();
                    } else {
                        setState({ formDataType: dataType });
                        return of([]);
                    }
                }),
                switchMap(
                    descendants => zzip(...descendants.map(d => d.isAbstract())).pipe(
                        map(
                            abstracts => descendants.filter((_, index) => !abstracts[index])
                        ),
                        map(types => (typesFilter && typesFilter(types)) || types),
                        switchMap(types => zzip(
                            of(types),
                            zzip(...types.map(t => t.config())),
                            zzip(...types.map(t => t.getTitle()))
                        ))
                    )
                )
            ).subscribe(
                ([descendants, configs, titles]) => setState({ descendants, titles, configs })
            );
        }

        if (subscription) {
            return () => subscription.unsubscribe();
        }
    }, [dataType, rootId, _type, typesFilter]);

    useEffect(() => {
        if (formDataType) {
            const subscription = formDataType.config().subscribe(
                dataTypeConfig => setState({ dataTypeConfig })
            );
            return () => subscription.unsubscribe();
        }
    }, [formDataType]);

    useEffect(() => {
        if (formDataType && dataTypeConfig) {
            let submitSubscription;
            const submitterSubscription = submitter.subscribe(() => {
                submitSubscription = onFormSubmit(formDataType, value, dataTypeConfig.formSanitizer).pipe(
                    catchError(error => {
                        setState({ errors: error.response.data });
                        return of(null);
                    })
                ).subscribe();
            });

            let seedSubscription;
            if (!rootId && !seeded.current) {
                const seedObservable = of(seed || dataTypeConfig.actions?.new?.seed);
                seedSubscription = seedObservable.pipe(
                    switchMap(seed => {
                        if (typeof seed === 'function') {
                            seed = seed(formDataType);
                        }
                        if (isObservable(seed)) {
                            return seed;
                        }
                        return of(seed);
                    })
                ).subscribe(seed => {
                    seeded.current = true;
                    if (seed) {
                        seed[FETCHED] = true;
                        value.set(seed);
                    }
                });
            }

            return () => {
                submitterSubscription.unsubscribe();
                if (seedSubscription) {
                    seedSubscription.unsubscribe();
                }
            }
        }
    }, [value, submitter, viewport, formDataType, rootId, onFormSubmit, dataTypeConfig, seed]);

    useEffect(() => {
        if (dataTypeConfig) {
            const { formViewControlProps } = dataTypeConfig;
            if (formViewControlProps) {
                if (typeof formViewControlProps === 'function') {
                    const subscription = value.changed().subscribe(
                        v => setState({ configProps: formViewControlProps(v) })
                    );
                    value.changed().next(value.get());
                    return () => subscription.unsubscribe();
                } else {
                    setState({ configProps: formViewControlProps });
                }
            }
        }
    }, [dataTypeConfig, value]);

    const handleFetched = initialFormValue => {
        setState({ initialFormValue });
        onUpdate && onUpdate(initialFormValue);
    };

    const formHeight = `${height} - ${theme.spacing(16)}px`;

    let control;

    if (dataType && dataTypeConfig) {
        const FormViewControl = dataTypeConfig.formViewControl || ObjectControl;
        control = <FormViewControl disabled={disabled}
                                   readOnly={readOnly}
                                   {...configProps}
                                   dataType={formDataType}
                                   width={width}
                                   height={formHeight}
                                   value={value}
                                   errors={errors}
                                   onStack={onStack}
                                   onFetched={handleFetched}/>;
    } else {
        const textSkeleton = <Skeleton variant="text" component="div"/>;
        if (configs) {
            control = configs.map(
                (config, index) => ((!config.crud || config.crud.includes(CRUD.create)) &&
                    <ListItem button
                              component="li"
                              key={descendants[index].id}
                              onClick={() => setState({ formDataType: descendants[index] })}>
                        <ListItemIcon>
                            {config.icon}
                        </ListItemIcon>
                        <ListItemText primary={titles[index]}/>
                    </ListItem>
                )
            ).filter(item => item);
        } else if (descendantsCount) {
            const iconSkeleton = <Skeleton variant="circle"
                                           component="div"
                                           width={theme.spacing(3)}
                                           height={theme.spacing(3)}/>;
            control = [];
            for (let i = 0; i < descendantsCount; i++) {
                control.push(
                    <ListItem key={`sk_${i}`} component="li">
                        <ListItemIcon>
                            {iconSkeleton}
                        </ListItemIcon>
                        <ListItemText>
                            {textSkeleton}
                        </ListItemText>
                    </ListItem>
                );
            }
        }
        control = (
            <div className="flex column full-width justify-content-center">
                <List style={{ height: `calc(${formHeight})` }} component="ul">
                    <ListSubheader className={classes.bgPaper} component="li">
                        <Typography variant="h6" component="h6">
                            {titles ? 'Pick a type' : textSkeleton}
                        </Typography>
                    </ListSubheader>
                    {control}
                </List>
            </div>
        );
    }

    const formContext = {
        rootId,
        rootDataType: dataType,
        value,
        viewport,
        submitter,
        initialFormValue
    };

    return (
        <FormContext.Provider value={formContext}>
            <div className={classes.root}
                 style={{ minHeight: `calc(${formHeight})` }}>
                {control}
            </div>
        </FormContext.Provider>
    );
};

export default FormView;
