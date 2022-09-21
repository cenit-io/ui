import React, { useEffect } from 'react'
import StringControl from './StringControl';
import { LinearProgress, makeStyles } from '@material-ui/core';
import EmbedsOneControl from "./EmbedsOneControl";
import EmbedsManyControl from "./EmbedsManyControl";
import BooleanControl from "./BooleanControl";
import RefOneControl from "./RefOneControl";
import RefManyControl from "./RefManyControl";
import ErrorMessages from "./ErrorMessages";
import zzip from "../util/zzip";
import NumericControl from "./NumericControl";
import IntegerControl from "./IntegerControl";
import StringCodeControl from "./StringCodeControl";
import JsonControl from "./JsonControl";
import EnumControl from "./EnumControl";
import DateTimeControl from "./DateTimeControl";
import { useSpreadState } from "../common/hooks";
import { of } from "rxjs";
import FormHelperText from "@material-ui/core/FormHelperText";
import { useTenantContext } from "../layout/TenantContext";

function controlComponentFor(property) {
  if (property.propertySchema.enum) {
    return EnumControl;
  }

  switch (property.type) {

    case 'embedsOne': {
      return EmbedsOneControl;
    }

    case 'embedsMany': {
      return EmbedsManyControl;
    }

    case 'boolean': {
      return BooleanControl;
    }

    case 'refOne': {
      if (property.propertySchema.export_embedded) {
        return EmbedsOneControl;
      }
      return RefOneControl;
    }

    case 'refMany': {
      if (property.propertySchema.export_embedded) {
        return EmbedsManyControl;
      }
      return RefManyControl;
    }

    case 'number': {
      return NumericControl;
    }

    case 'integer': {
      return IntegerControl;
    }

    case 'string': {
      const format = property.propertySchema.format;
      if (format === 'date' || format === 'time' || format === 'date-time') {
        return DateTimeControl;
      }

      if (property.propertySchema.contentMediaType) {
        return StringCodeControl;
      }

      return StringControl;
    }

    default: {

      if (property.name === '_id' || property.name === 'id') {
        return StringControl;
      }

      return JsonControl;
    }
  }
}

const configurableProps = ['readOnly', 'disabled'];

function configProps(config, value, user) {
  return config && configurableProps.reduce((prev, prop) => {
    let fieldConfig = config[prop];
    if (fieldConfig !== undefined) {
      if (typeof fieldConfig === 'function') {
        fieldConfig = fieldConfig(value, user);
      }
      prev[prop] = fieldConfig;
    }
    return prev;
  }, {});
}

const useStyles = makeStyles(theme => ({
  control: {
    padding: theme.spacing(1)
  },
  error: {
    color: theme.palette.error.main
  }
}));

function PropertyControl(props) {
  const [tenantState] = useTenantContext();

  const { user } = tenantState;

  const [state, setState] = useSpreadState();

  const { errors, property, onChange, config, value } = props;
  const { schema, controlErrors } = state;
  const classes = useStyles();

  const { description } = state;

  useEffect(() => {
    const subscription = zzip(
      property.getSchema(),
      (config.title && of(config.title)) || property.getTitle(),
      (config.description && of(config.description)) || property.getDescription()
    ).subscribe(
      ([schema, title, description]) => setState({ schema, title, description })
    );

    return () => subscription.unsubscribe();
  }, [config, property]);

  useEffect(() => setState({ controlErrors: null }), [errors]);

  const handleChange = value => {
    if (errors && errors.length && !controlErrors) {
      setErrors([]);
    }
    onChange(value);
  };

  const setErrors = controlErrors => setState({ controlErrors });

  if (schema) {
    const ControlComponent = config?.control || controlComponentFor(property);

    const currentErrors = ControlComponent.ownErrorMessages ? null : (controlErrors || errors);

    const control = <ControlComponent {...state}
                                      {...props}
                                      {...configProps(config, value.get(), user)}
                                      errors={currentErrors}
                                      onError={setErrors}
                                      onChange={handleChange} />;

    return (
      <div className={classes.control}>
        <ErrorMessages errors={currentErrors}>
          {control}
          <FormHelperText component="p">
            {description}
          </FormHelperText>
        </ErrorMessages>
      </div>
    );
  }

  return <LinearProgress />;
}

export default PropertyControl;
