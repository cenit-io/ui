import React from 'react';
import Box from '@mui/material/Box';
import '../common/FlexBox.css';

export const FormGroup = ({ children, error }) => {
  return <Box
    className="flex column full-width relative"
    sx={(theme) => ({
      borderLeft: 'solid',
      borderLeftColor: error ? theme.palette.error.light : theme.palette.text.secondary
    })}>
    {children}
  </Box>;
};
