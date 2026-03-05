import React from 'react';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import RecordSelector from "../components/RecordSelector";
import SearchIcon from '@mui/icons-material/Search';

export default function ({ disabled, dataTypeSelector, onSelect, searchIcon, selectorComponent, backColor, backOverColor }) {
  const theme = useTheme();
  const inputSx = {
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 7),
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: 200,
      },
    },
  };

  const Selector = selectorComponent || RecordSelector;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
        backgroundColor: backColor || alpha(theme.palette.common.white, 0.08),
        '&:hover': {
          backgroundColor: backOverColor || alpha(theme.palette.common.white, 0.14),
        },
        transition: 'background-color 150ms ease, border-color 150ms ease',
        mr: theme.spacing(2),
        ml: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
          ml: theme.spacing(3),
          width: 'auto',
        },
      }}>
      <Box
        sx={{
          width: theme.spacing(7),
          height: '100%',
          position: 'absolute',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {searchIcon || <SearchIcon />}
      </Box>
      <Selector dataTypeSelector={dataTypeSelector}
                onSelect={onSelect}
                inputSx={inputSx}
                disabled={disabled} />
    </Box>
  )
};
