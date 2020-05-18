import React, { useEffect, useReducer } from 'react';
import ObjectControl from "./ObjectControl";
import { makeStyles, useTheme } from "@material-ui/core";
import { catchError, switchMap, tap, map } from "rxjs/operators";
import { of } from "rxjs";
import reducer from "../common/reducer";
import zzip from "../util/zzip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import Typography from "@material-ui/core/Typography";
import { Skeleton } from "@material-ui/lab";
import ListSubheader from "@material-ui/core/ListSubheader";

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

const FormView = ({ dataType, width, height, value, _type, onChange, disabled, onStack, rootId, readOnly, submitter, onSubmitDone }) => {

    const [state, setState] = useReducer(reducer, {});
    const classes = useStyles();
    const theme = useTheme();

    const { formDataType, errors, descendants, titles, descendantsCount } = state;

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
                    descendants => zzip(
                        of(descendants),
                        zzip(...descendants.map(d => d.isAbstract()))
                    )
                ),
                map(
                    ([descendants, abstracts]) => descendants.filter(
                        (_, index) => !abstracts[index]
                    )
                ),
                tap(
                    descendants => setState({ descendants })
                ),
                switchMap(
                    descendants => zzip(...descendants.map(d => d.getTitle()))
                )
            ).subscribe(
                titles => setState({ titles })
            );
        }

        if (subscription) {
            return () => subscription.unsubscribe();
        }
    }, [dataType, rootId, _type]);

    useEffect(() => {
        const subscription = submitter.pipe(
            switchMap(
                ({ value, viewport }) =>
                    formDataType.post(value, {
                        viewport,
                        add_only: rootId,
                        add_new: !rootId,
                        polymorphic: true
                    })
            ),
            catchError(error => {
                setState({ errors: error.response.data });
                return of(null);
            })
        ).subscribe(value => onSubmitDone(value));

        return () => subscription.unsubscribe();
    }, [submitter, dataType, onSubmitDone, rootId]);

    function handleChange(value) {
        onChange && onChange(value);
    }

    const formHeight = `${height} - ${theme.spacing(16)}px`;

    let control;

    if (dataType && formDataType) {
        control = <ObjectControl rootDataType={dataType}
                                 jsonPath='$'
                                 dataTypeId={formDataType.id}
                                 width={width}
                                 height={formHeight}
                                 value={value}
                                 errors={errors}
                                 onChange={handleChange}
                                 disabled={disabled}
                                 readOnly={readOnly}
                                 onStack={onStack}
                                 rootId={rootId}/>;
    } else {
        const textSkeleton = <Skeleton variant="text"/>;
        if (titles) {
            control = titles.map(
                (title, index) => (
                    <ListItem button
                              key={descendants[index].id}
                              onClick={() => setState({ formDataType: descendants[index] })}>
                        <ListItemIcon>
                            {index % 2 === 0 ? <InboxIcon/> : <MailIcon/>}
                        </ListItemIcon>
                        <ListItemText primary={title}/>
                    </ListItem>
                )
            );
        } else if (descendantsCount) {
            const iconSkeleton = <Skeleton variant="circle"
                                           width={theme.spacing(3)}
                                           height={theme.spacing(3)}/>;
            control = [];
            for (let i = 0; i < descendantsCount; i++) {
                control.push(
                    <ListItem key={`sk_${i}`}>
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
                <List style={{ height: `calc(${formHeight})` }}>
                    <ListSubheader className={classes.bgPaper}>
                        <Typography variant="h6">
                            {titles ? 'Pick a type' : textSkeleton}
                        </Typography>
                    </ListSubheader>
                    {control}
                </List>
            </div>
        );
    }

    return <div className={classes.root}
                style={{ minHeight: `calc(${formHeight})` }}>
        {control}
    </div>;
};

export default FormView;
