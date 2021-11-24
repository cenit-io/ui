import { Chip, makeStyles, Tooltip } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import purple from "@material-ui/core/colors/purple";
import green from "@material-ui/core/colors/green";
import orange from "@material-ui/core/colors/orange";
import blue from "@material-ui/core/colors/blue";
import red from "@material-ui/core/colors/red";
import grey from "@material-ui/core/colors/grey";
import AutocompleteControl from "./AutocompleteControl";
import { InfoRounded } from "@material-ui/icons";
import { Zoom } from "@material-ui/core";

const SCOPES = [
  "auth",
  "session_access",
  "offline_access",
  "multi_tenant",
  "openid",
  "profile",
  "email",
  "create",
  "read",
  "update",
  "delete",
  "digest",
];

const COLORS = {
  create: blue[200],
  read: green[200],
  update: orange[200],
  delete: red[200],
  digest: purple[200],
};

const useStyles = makeStyles((theme) =>
  Object.keys(COLORS).reduce(
    (classes, scope) => ({
      ...classes,
      [scope]: {
        color: theme.palette.getContrastText(COLORS[scope]),
        backgroundColor: COLORS[scope],
      },
    }),
    {}
  )
);

const useStylesReadOnlyView = makeStyles((theme) => ({
  root: {
    width: "100%",
    minHeight: "4rem",
    border: `1px solid ${grey[400]}`,
    backgroundColor: grey[200],
    position: "relative",
    marginTop: "1.7rem",
  },
  header: {
    width: "4rem",
    height: "2rem",
    fontWeight: "bold",
    fontSize: "14px",
    color: theme.palette.background.paper,
    backgroundColor: COLORS.create,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "-1.7rem",
    left: "-1px",
  },
  list: {
    marginLeft: "4rem",
    paddingLeft: "0.6rem",
    "& li": {
      marginBottom: "0.7rem",
    },
  },
  listTitle: {
    fontWeight: "bold",
  },
  listDataType: {
    color: theme.palette.secondary.main,
  },
  icon: {
    fill: theme.palette.secondary.main,
  },
}));

const ScopeLi = ({ title, dataType }) => {
  const scopeDescriptions = {
    auth: {
      description: (
        <>
          <b>Authorize</b> other applications
        </>
      ),
      tooltip:
        "The application will be able to authorize other applications with its same grants",
      descriptionDataType: null,
    },
    session_access: {
      description: (
        <>
          Get <b>session</b> access
        </>
      ),
      tooltip:
        "The application access span will be automatically extended until it expires",
      descriptionDataType: null,
    },
    offline_access: {
      description: (
        <>
          <b>Offline access</b>
        </>
      ),
    },
    multi_tenant: {
      description: (
        <>
          <b>Switch</b> across your tenants
        </>
      ),
      tooltip:
        "The application will be able to access all your tenants with its grants",
    },
    openid: {
      description: (
        <>
          <b>Openid</b>
        </>
      ),
      tooltip: null,
    },
    profile: {
      description: (
        <>
          <b>View your basic profile</b>
        </>
      ),
      tooltip: null,
      descriptionDataType: null,
    },
    email: {
      description: (
        <>
          <b>View your email</b>
        </>
      ),
    },
    create: {
      description: (
        <>
          <b>Create</b> records of any data type
        </>
      ),
      tooltip: null,
      descriptionDataType: (
        <>
          <b>Create</b> records of the following data types:
        </>
      ),
    },
    read: {
      description: (
        <>
          <b>Read</b> records of any data type
        </>
      ),
      tooltip: null,
      descriptionDataType: (
        <>
          <b>Read</b> records of the following data types:
        </>
      ),
    },
    update: {
      description: (
        <>
          <b>Update</b> records of any data type
        </>
      ),
      tooltip: null,
      descriptionDataType: (
        <>
          <b>Update</b> records of the following data types:
        </>
      ),
    },
    delete: {
      description: (
        <>
          <b>Delete</b> records of any data type
        </>
      ),
      tooltip: null,
      descriptionDataType: (
        <>
          <b>Delete</b> records of the following data types:
        </>
      ),
    },
    digest: {
      description: (
        <>
          <b>Digest</b> records of any data type
        </>
      ),
      tooltip: null,
      descriptionDataType: (
        <>
          <b>Digest</b> records of the following data types:
        </>
      ),
    },
  };

  const classes = useStylesReadOnlyView(),
    scope = scopeDescriptions[title];

  let { description, descriptionDataType, tooltip } = scope;

  return (
    <li>
      {description}
      {dataType && (
        <spam className={classes.listDataType}> {descriptionDataType} </spam>
      )}
      {tooltip && (
        <Tooltip
          title={tooltip}
          placement="top"
          TransitionComponent={Zoom}
          arrow
        >
          <InfoRounded
            fontSize="small"
            color="default"
            className={classes.icon}
          />
        </Tooltip>
      )}
    </li>
  );
};

const ReadOnlyView = ({ value }) => {
  const [scopes, setScopes] = useState([]);

  const classes = useStylesReadOnlyView();

  useEffect(() => {
    let tempArray = [],
      scopeArray = [];

    if (value.parent.cache.scope) {
      tempArray = value.parent.cache.scope.split(" ");
    }

    /*
         Here build the array with the structure
         [{ scope: "NameScope", dataType: "NameDatatype" },
          { scope: "NameScope", dataType: null }]
    */
    scopeArray = tempArray.map((scope) => {
      return { scope: scope, dataType: null };
    });

    setScopes(scopeArray);
  }, [value.parent.cache.scope]);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span> Scope </span>
      </div>
      <ul className={classes.list}>
        {scopes.map((scope, index) => (
          <ScopeLi
            key={`${scope.scope}_${scope.dataType}_${index}`}
            title={scope.scope}
            dataType={scope.dataType}
          />
        ))}
      </ul>
    </div>
  );
};

export default function OauthScopeControl(props) {
  const classes = useStyles();

  const { scopes, readOnly, disabled } = props;

  const renderTags = (tagValue, getTagProps) =>
    tagValue.map((option, index) => {
      const tagProps = getTagProps({ index });
      if (readOnly) {
        tagProps.onDelete = undefined;
      }
      return (
        <Chip
          classes={{ root: classes[option] }}
          label={option.toUpperCase()}
          {...tagProps}
          disabled={disabled}
        />
      );
    });

  return readOnly ? (
    <ReadOnlyView {...props} />
  ) : (
    <AutocompleteControl
      {...props}
      options={scopes || SCOPES}
      multiple={true}
      renderTags={renderTags}
      formatter={(values) => values?.join(" ")}
      parser={(value) => value?.split(" ")}
      disabled={disabled || readOnly}
    />
  );
}
