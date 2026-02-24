import React from 'react';
import { Box, CircularProgress } from "@mui/material";
import clsx from "clsx";
export default function ({ height, className }) {
  const style = height ? { height } : null;

  return <Box
    className={clsx(className)}
    style={style}
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
    <CircularProgress />
  </Box>
}
