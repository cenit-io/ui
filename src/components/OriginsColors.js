import purple from "@material-ui/core/colors/purple";
import green from "@material-ui/core/colors/green";
import orange from "@material-ui/core/colors/orange";
import blue from "@material-ui/core/colors/blue";
import red from "@material-ui/core/colors/red";
import { makeStyles } from "@material-ui/core";

export const OriginsColors = {
  owner: purple[200],
  shared: green[200],
  cenit: orange[200],
  admin: blue[600],
  tmp: red[200],
};

export const useOriginsStyles = makeStyles(theme => Object.keys(OriginsColors).reduce((classes, origin) => {
  classes[origin] = {
    background: OriginsColors[origin]
  };
  classes[`${origin}Text`] = {
    color: `${theme.palette.getContrastText(OriginsColors[origin])} !important`,
    '&.Mui-checked': {
      color: theme.palette.getContrastText(OriginsColors[origin]),
    }
  };
  return classes;
}, {}));
