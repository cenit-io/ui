import { Chip, makeStyles } from "@material-ui/core";
import React from "react";
import purple from "@material-ui/core/colors/purple";
import green from "@material-ui/core/colors/green";
import orange from "@material-ui/core/colors/orange";
import blue from "@material-ui/core/colors/blue";
import red from "@material-ui/core/colors/red";
import AutocompleteControl from "./AutocompleteControl";

const SCOPES = [
    'auth',
    'session_access',
    'offline_access',
    'multi_tenant',
    'openid',
    'profile',
    'email',
    'create',
    'read',
    'update',
    'delete',
    'digest'
];

const COLORS = {
    create: blue[200],
    read: green[200],
    update: orange[200],
    delete: red[200],
    digest: purple[200],
};

const useStyles = makeStyles(theme => Object.keys(COLORS).reduce(
    (classes, scope) => ({
        ...classes,
        [scope]: {
            color: theme.palette.getContrastText(COLORS[scope]),
            backgroundColor: COLORS[scope],
        }
    }), {}
));

export default function OauthScopeControl(props) {

    const classes = useStyles();

    const { scopes, readOnly, disabled } = props;

    const renderTags = (tagValue, getTagProps) =>
        tagValue.map((option, index) => {
                const tagProps = getTagProps({ index });
                if (readOnly) {
                    tagProps.onDelete = undefined;
                }
                return <Chip classes={{ root: classes[option] }}
                             label={option.toUpperCase()}
                             {...tagProps}
                             disabled={disabled}/>;
            }
        );

    return (
        <AutocompleteControl {...props}
                             options={scopes || SCOPES}
                             multiple={true}
                             renderTags={renderTags}
                             formatter={values => values?.join(' ')}
                             parser={value => value?.split(' ')}
                             disabled={disabled || readOnly}/>
    );
}
