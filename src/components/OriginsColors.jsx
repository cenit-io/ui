import { purple, green, orange, blue, red } from '@mui/material/colors';

export const OriginsColors = {
  owner: purple[200],
  shared: green[200],
  cenit: orange[200],
  admin: blue[600],
  tmp: red[200],
};

export const originBackgroundSx = (origin) => ({
  background: OriginsColors[origin]
});

export const originTextSx = (theme, origin) => ({
  color: `${theme.palette.getContrastText(OriginsColors[origin])} !important`,
  '&.Mui-checked': {
    color: theme.palette.getContrastText(OriginsColors[origin]),
  },
});
