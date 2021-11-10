import { Chip, TextField, useTheme } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";

const scopes = [
  { title: "auth", value: "auth", color: "#D5C8C8" },
  { title: "session_access", value: "session_access", color: "#D5C8C8" },
  { title: "offline_access", value: "offline_access", color: "#D5C8C8" },
  { title: "multi_tenant", value: "multi_tenant", color: "#D5C8C8" },
  { title: "openid", value: "openid", color: "#D5C8C8" },
  { title: "email", value: "email", color: "#D5C8C8" },
  { title: "profile", value: "profile", color: "#D5C8C8" },
  { title: "create", value: "create", color: "#5BC0DE" },
  { title: "read", value: "read", color: "#5CB85C" },
  { title: "update", value: "update", color: "#F0AD4E" },
  { title: "delete", value: "delete", color: "#D9534F" },
  { title: "digest", value: "digest", color: "#663399" },
];

function OauthScopeControl(props) {
  const [val, setValue] = useState([]);
  const [valueToSave, setValueToSave] = useState("");
  const theme = useTheme();
  const scopeValues = props.value.parent.cache.scope;
  const { readOnly, title, value } = props;

  useEffect(() => {
    let result = [];
    function startsWith(element) {
      return this.includes(element.value);
    }

    if (scopeValues) {
      result = scopes.filter(startsWith, scopeValues);
    }

    setValue(result);
  }, [scopeValues]);

  useEffect(() => {
    setValueToSave(val.map((v) => v.title).join(" "));
  }, [val, valueToSave]);

  useEffect(() => {
    value.set(valueToSave);
  }, [value, valueToSave]);

  const onChangeAutocomplete = (event, newValue) => {
    setValue([...newValue]);
  };

  const renderTagsAutocomplete = (tagValue, getTagProps) =>
    tagValue.map((option, index) => (
      <Chip
        style={{
          backgroundColor: option.color,
          color: theme.palette.getContrastText(option.color),
        }}
        label={option.title.toUpperCase()}
        {...getTagProps({ index })}
      />
    ));

  return (
    <Autocomplete
      multiple
      id="scopes-tags"
      value={val}
      disabled={readOnly}
      onChange={onChangeAutocomplete}
      options={scopes}
      getOptionLabel={(option) => option.title}
      renderTags={renderTagsAutocomplete}
      renderInput={(params) => (
        <TextField
          {...params}
          label={title}
          placeholder={readOnly ? "" : "Add scope"}
        />
      )}
    />
  );
}

export default OauthScopeControl;
