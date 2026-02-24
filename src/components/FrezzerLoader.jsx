import React from 'react';
import Box from "@mui/material/Box";
import Loading from "./Loading";
import clsx from "clsx";

export default function FrezzerLoader({ backdropClass, backdropStyle }) {
  return (
    <Box
      className={clsx(backdropClass)}
      style={backdropStyle}
      sx={(theme) => ({
        zIndex: 1111,
        opacity: 0.6,
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: theme.palette.background.paper
      })}>
      <Loading />
    </Box>
  );
}
