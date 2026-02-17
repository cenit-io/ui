import makeStyles from '@mui/styles/makeStyles';

import { purple, green, orange, blue, red } from '@mui/material/colors';

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
