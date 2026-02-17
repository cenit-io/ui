import React, { useEffect, useRef } from 'react';
import { useFormContext } from "./FormContext";
import { useSpreadState } from "../common/hooks";
import { FormRootValue } from "../services/FormValue";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FilledInput from "@mui/material/FilledInput";
import CircularProgress from "@mui/material/CircularProgress";
import { Tooltip, useTheme } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";

const FetchIcon = props => (
  <SvgIcon {...props}>
    <g>
      <path d="M5,20h14v-2H5V20z M19,9h-4V3H9v6H5l7,7L19,9z" />
    </g>
  </SvgIcon>
);

function DefaultFetchComponent({ title, fetching, onFetch }) {

  const theme = useTheme();

  let fetch;
  let placeholder;
  if (fetching) {
    placeholder = 'Fetching...';
    fetch = <CircularProgress size={theme.spacing(3)} />;
  } else {
    fetch = (
      <InputAdornment position="end">
        <Tooltip title="Fetch">
          <IconButton onClick={onFetch} edge="end" size="large">
            <FetchIcon />
          </IconButton>
        </Tooltip>
      </InputAdornment>
    );
    placeholder = 'Click fetch to retrive the value';
  }

  return (
    <FormControl className="full-width" variant="filled">
      <InputLabel>{title}</InputLabel>
      <FilledInput placeholder={placeholder}
                   endAdornment={fetch}
                   readOnly={true} />
    </FormControl>
  );
}

const lazy = (Control, opts = {}) => (function(props) {

  const { value, onChange, onDelete, title } = props;

  const lazyValue = useRef(new FormRootValue(value.get()));

  const [state, setState] = useSpreadState();

  const { rootId, rootDataType } = useFormContext();

  const { fetched, fetching } = state;

  const { skipChanges, fetchComponent } = opts;

  useEffect(() => {
    const subscription = value.changed().subscribe(
      v => lazyValue.current.set(v, true)
    );
    value.changed().next(value.get());
    return () => subscription.unsubscribe();
  }, [value]);

  useEffect(() => {
    if (fetching) {
      const subscription = rootDataType.get(rootId, {
        jsonPath: value.jsonPath()
      }).subscribe(
        v => {
          if (skipChanges) {
            lazyValue.current.set(v, true);
          } else {
            value.set(v, true);
          }
          setState({ fetching: false, fetched: true });
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [fetching, rootId, rootDataType, value, skipChanges]);

  let handleChange;
  let handleDelete;
  if (!skipChanges) {
    handleChange = v => {
      value.set(v, true);
      onChange && onChange(v);
    };
    handleDelete = () => {
      value.delete();
      onDelete && onDelete();
    };
  }

  if (!rootId || fetched) {
    return <Control {...props}
                    value={lazyValue.current}
                    onChange={handleChange}
                    onDelete={handleDelete} />;
  }

  const FetchComponent = fetchComponent || DefaultFetchComponent;

  return <FetchComponent title={title}
                         fetching={fetching}
                         onFetch={() => setState({ fetching: true })} />;
});

export default lazy;
