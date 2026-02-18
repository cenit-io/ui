import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import { Box, Typography } from "@mui/material";
import viewerComponentFor from "../viewers/viewerComponentFor";
import clsx from "clsx";

export default function ViewerControl({ title, value, property, config }) {

  const [state, setState] = useSpreadState();

  useEffect(() => {
    const subscription = value.parent.changed().subscribe(
      item => setState({ item })
    );
    return () => subscription.unsubscribe();
  }, [value]);

  const { item } = state;

  const Viewer = config.viewer || viewerComponentFor(property);

  return (
    <Box sx={{ border: theme => `solid 1px ${theme.palette.background.default}` }}>
      <Box
        className={clsx('flex')}
        sx={{
          minHeight: theme => theme.spacing(7),
          background: theme => theme.palette.background.default,
          borderTopLeftRadius: theme => theme.spacing(0.5),
          borderTopRightRadius: theme => theme.spacing(0.5),
          alignItems: 'center',
          px: 2,
        }}
      >
        <Typography variant="subtitle2">
          {title}
        </Typography>
      </Box>
      <Box className={clsx('flex justify-content-center')} sx={{ p: 2 }}>
        <Viewer prop={property}
                value={value.get()}
                item={item} />
      </Box>
    </Box>
  );
}
