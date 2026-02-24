import React from 'react';
import Box from '@mui/material/Box';
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function ResponsiveContainer({ docked, forwardRef, children }) {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.down('sm'));
  const md = useMediaQuery(theme.breakpoints.up('md'));

  return <Box
    ref={forwardRef}
    sx={{
      pt: theme.spacing(3),
      pb: theme.spacing(3),
      overflow: 'auto',
      boxSizing: 'border-box',
      flexGrow: 1,
      ...(xs ? {
        pl: theme.spacing(1),
        pr: theme.spacing(1),
      } : {
        pl: '15%',
        pr: '15%',
      }),
      ...(md ? {
        pl: '25%',
        pr: '25%',
      } : {}),
    }}>

    {children}
  </Box>;
};

export default ResponsiveContainer;
