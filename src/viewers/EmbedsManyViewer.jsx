import React from 'react';
import Box from '@mui/material/Box';
import EmbedsOneViewer from "./EmbedsOneViewer";

export default function EmbedsManyViewer({ prop, value }) {

  if (value) {
    const viewers = value.map(
      (v, index) => (
        <Box key={index} sx={{ ml: index ? 1 : 0 }}>
          <EmbedsOneViewer value={v} prop={prop} />
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
