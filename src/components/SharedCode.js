import React, { useEffect } from 'react';
import { makeStyles } from "@material-ui/core";
import Alert from '@material-ui/lab/Alert';
import { useFormContext } from "./FormContext";
import StringCodeControl from "./StringCodeControl";
import { useSpreadState } from "../common/hooks";
import LinearProgress from "@material-ui/core/LinearProgress";
import zzip from "../util/zzip";
import { DataType } from "../services/DataTypeService";
import RefOneViewer from "../viewers/RefOneViewer";
import ErrorAlert from "../actions/Alert";

const useStyles = makeStyles(theme => ({
  box: {
    '& + &': {
      marginTop: theme.spacing(2)
    }
  },
  chip: {
    margin: theme.spacing(0, .5)
  }
}));

function isShared({ origin }) {
  return origin && origin !== 'default';
}

export default function SharedCode(props) {

  const [state, setState] = useSpreadState();

  const { rootId, rootDataType } = useFormContext();

  const classes = useStyles();

  const {
    rootDataTypeTitle, snippetDataType, snippet, default_snippet,
    creator_access, snippet_ref_binding, error
  } = state;

  useEffect(() => {
    if (rootId) {
      const subscription = zzip(
        rootDataType.getTitle(),
        DataType.find({
          namespace: 'Setup',
          name: 'Snippet'
        }),
        rootDataType.get(rootId, {
          viewport: '{snippet {id namespace name origin} ' +
            'default_snippet {id namespace name origin} creator_access snippet_ref_binding {id}}'
        })
      ).subscribe(([rootDataTypeTitle, snippetDataType, snippetCoded]) => {
        if (snippetCoded) {
          const {
            snippet, default_snippet, creator_access, snippet_ref_binding
          } = snippetCoded;

          setState({
            rootDataTypeTitle,
            snippetDataType,
            snippet,
            default_snippet,
            creator_access,
            snippet_ref_binding
          });
        } else {
          setState({ error: 'Record not found' });
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [rootId, rootDataType]);

  if (error) {
    return <ErrorAlert message={error} />;
  }

  const { alertsOnly, value, readOnly } = props;

  const parent = value.parent.get();

  let defaultLink;

  let alerts = [];
  if (!rootId) {
    alerts.push(
      <Alert key="new_snippet_info" severity="info" className={classes.box}>
        A new snippet will be created and set as default.
      </Alert>
    );
  } else if (snippetDataType) {
    if (default_snippet) {
      defaultLink = <RefOneViewer refDataType={snippetDataType}
                                  value={default_snippet}
                                  variant="outlined"
                                  color="primary"
                                  className={classes.chip} />;

      const tail = default_snippet.id === snippet?.id
        ? "and it's actually the current code."
        : '';

      alerts.push(
        <Alert key="default_snippet_info" severity="info" className={classes.box}>
          The <b>default snippet</b> ref is pointing to
          {defaultLink}
          {tail}
        </Alert>
      );

      if (isShared(parent) && (
        !isShared(default_snippet) ||
        (parent.origin === 'shared' && default_snippet.origin !== 'shared'))) {
        alerts.push(
          <Alert key="default_snippet_not_same_origin" severity="error" className={classes.box}>
            This {rootDataTypeTitle} [<b>{parent.origin || 'default'}</b>]
            and the default snippet [<b>{default_snippet.origin || 'default'}</b>]
            are not in the same sharing scope! To fix this go to {defaultLink}
            and cross it to the <b>{parent.origin || 'default'}</b> scope.
          </Alert>
        );
      }
    } else {
      alerts.push(
        <Alert key="default_snippet_ref_broken" severity="error" className={classes.box}>
          The default snippet ref is <b>broken</b> or unreachable!
        </Alert>
      );
      if (creator_access) {
        alerts.push(
          <Alert key="default_snippet_ref_broken_creator_access" severity="info" className={classes.box}>
            However you're the creator of this code, <b>continue and save</b> to set this code
            as <b>default</b>.
          </Alert>
        );
      }
    }

    if (snippet) {
      const currentLink = <RefOneViewer refDataType={snippetDataType}
                                        value={snippet}
                                        variant="outlined"
                                        color="primary"
                                        className={classes.chip} />;

      if (default_snippet && default_snippet.id !== snippet.id) {
        alerts.push(
          <Alert key="delete_binding_alert" severity="info" className={classes.box}>
            Go to the bindings configuration and delete the binding to use the default code.
          </Alert>
        );
      }

      if (isShared(snippet)) {
        if (!readOnly) {
          alerts.push(
            <Alert key="shared_editing" severity="warning" className={classes.box}>
              You're seeing the code from {defaultLink} which is shared and therefore not editable. If you
              continue and save <b>a new snippet will be created</b>.
            </Alert>
          );
        }
      } else if (snippet.id !== default_snippet?.id) {
        alerts.push(
          <Alert key="current_snippet_link" severity={readOnly ? 'success' : 'warning'}
                 className={classes.box}>
            This code is from {currentLink} {readOnly ? '' : " and is being edited now."}
          </Alert>
        );
        if (default_snippet) {
          // TODO Include a link to compare both snippets (when the compare action is ready)
        }
      }
    } else {
      if (snippet_ref_binding?.id) {
        alerts.push(
          <Alert key="broken_snippet_ref_binding" severity="warning" className={classes.box}>
            There's a snippet ref binding and it's <b>broken</b>! The broken ref binding will be <b>fixed
            when saved</b>.
          </Alert>
        );
        alerts.push(
          <Alert key="delete_broken_binding_alert" severity="info" className={classes.box}>
            Go to the bindings configuration and delete the binding to use the default code.
          </Alert>
        );
      }
    }
    // TODO Include a link to the snippet bind configuration
  } else {
    alerts.push(<LinearProgress key="loader" className="full-width" />);
  }

  let control;
  if (!alertsOnly) {
    control = (
      <div className={classes.box}>
        <StringCodeControl {...props} />
      </div>
    );
  }

  return (
    <>
      {alerts}
      {control}
    </>
  );
}
