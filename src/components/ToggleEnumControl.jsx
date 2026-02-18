import React, { useEffect } from 'react';
import Button from "@mui/material/Button";
import { useSpreadState } from "../common/hooks";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { Alert } from '@mui/material';

export default function EnumControl({
  title,
  value,
  disabled,
  readOnly,
  error, // TODO Unused error parameter
  onChange,
  onDelete,
  property,
  optionsClasses,
  optionsSx
}) {
  const [state, setState] = useSpreadState({
    options: {}
  });

  const { options } = state;

  useEffect(() => {
    const subscription = value.changed().subscribe(() => setState({}));
    return () => subscription.unsubscribe();
  }, [value]);

  useEffect(() => {
    const enumOptions = property.propertySchema.enum;
    const options = {};
    const { enumNames } = property.propertySchema;
    enumOptions.forEach(
      (option, index) => options[option] = (enumNames && enumNames[index]) || `${option}`
    );
    setState({ options });
  }, [property]);

  const selectOption = option => () => {
    if (!readOnly) {
      if (value.get() === option) {
        value.delete();
        onDelete && onDelete()
      } else {
        value.set(option);
        onChange && onChange(option)
      }
      setState({}); //to refresh
    }
  };

  value.get();

  let optionsControls = Object.keys(options).map(
    option => (
      <Button key={option}
              variant={option === value.cache ? 'contained' : 'outlined'}
              className={clsx(
                optionsClasses && optionsClasses[option],
                (optionsClasses && option === value.cache) && 'selected'
              )}
              sx={{
                m: 1,
                ...(optionsSx && optionsSx[option] ? optionsSx[option] : {}),
                ...(optionsSx && option === value.cache && optionsSx[option]?.selected
                  ? optionsSx[option].selected
                  : {}),
              }}
              color={optionsClasses ? undefined : (option === value.cache ? 'primary' : 'default')}
              onClick={selectOption(option)}
              disabled={disabled}>
        {options[option]}
      </Button>
    )
  );

  if (!optionsControls.length) {
    optionsControls = (
      <Alert severity="info">
        No options available
      </Alert>
    )
  }

  return (
    <div>
      <Typography variant="subtitle2">
        {title}
      </Typography>
      <div className="flex justify-content-center align-items-center wrap">
        {optionsControls}
      </div>
    </div>
  );
}
