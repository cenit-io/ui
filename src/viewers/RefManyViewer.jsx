import React from 'react';
import Box from '@mui/material/Box';
import RefOneViewer from "./RefOneViewer";

export default function RefManyViewer({ prop, value }) {

  if (value) {
    const viewers = value.map(
      (v, index) => (
        <Box key={index} sx={{ ml: index ? 1 : 0 }}>
          <RefOneViewer value={v} prop={prop} />
        </Box>
      )
    );

    return (
      <Box className="flex">
        {viewers}
      </Box>
    );
  }

  return <span>-</span>;
}
