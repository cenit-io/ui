import React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export default (levelProjection, mode) => ({ value, item }) => {
  const theme = useTheme();

  const level = levelProjection(item);
  const colorByLevel = {
    create: theme.palette.success.main,
    updated: theme.palette.info.main,
    delete: theme.palette.error.main,
    cross: theme.palette.primary.light,
  };
  const backgroundByLevel = {
    create: {
      background: theme.palette.success.light,
      color: theme.palette.getContrastText(theme.palette.success.light),
    },
    update: {
      background: theme.palette.info.light,
      color: theme.palette.getContrastText(theme.palette.info.light),
    },
    delete: {
      background: theme.palette.error.light,
      color: theme.palette.getContrastText(theme.palette.error.light),
    },
    cross: {
      background: theme.palette.primary.light,
      color: theme.palette.getContrastText(theme.palette.primary.light),
    },
  };

  const str = (value === undefined || value === null)
    ? '-'
    : String(value);

  return (
    <Box
      sx={{
        ...(mode === 'background'
          ? {
            padding: theme.spacing(.5, 1),
            borderRadius: theme.spacing(1),
            textAlign: 'center',
            ...backgroundByLevel[level],
          }
          : {
            color: colorByLevel[level],
          }),
      }}>
      {str}
    </Box>
  );
};
