import React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export default (levelProjection, mode) => ({ value, item }) => {
  const theme = useTheme();

  const level = levelProjection(item);
  const paletteByLevel = {
    error: {
      main: theme.palette.error.main,
      light: theme.palette.error.light,
      contrast: theme.palette.getContrastText(theme.palette.error.light),
    },
    warning: {
      main: theme.palette.warning.main,
      light: theme.palette.warning.light,
      contrast: theme.palette.getContrastText(theme.palette.warning.light),
    },
    notice: {
      main: theme.palette.info.main,
      light: theme.palette.info.light,
      contrast: theme.palette.getContrastText(theme.palette.info.light),
    },
    info: {
      main: theme.palette.success.main,
      light: theme.palette.success.light,
      contrast: theme.palette.getContrastText(theme.palette.success.light),
    },
  };
  const levelPalette = paletteByLevel[level];

  const str = (value === undefined || value === null)
    ? '-'
    : String(value);

  const containerSx = mode === 'background'
    ? {
      padding: theme.spacing(.5, .1),
      borderRadius: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      textTransform: 'capitalize',
      background: levelPalette?.light,
      color: levelPalette?.contrast,
    }
    : {
      display: 'flex',
      alignItems: 'center',
      color: levelPalette?.main,
    };

  return (
    <Box sx={containerSx}>
      <Box sx={{ mr: "0.5rem" }}>
        <Box
          sx={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: mode === 'background' ? levelPalette?.light : levelPalette?.main,
          }}
        />
      </Box>
      <Box sx={{ width: "90%" }}>{str}</Box>
    </Box>
  );
};
