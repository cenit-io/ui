import React, { useState } from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

export default function Collapsible({ title, children, error, variant, defaultCollapsed, icon }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed === undefined ? true : Boolean(defaultCollapsed));

  const switchCollapsed = () => setCollapsed(!collapsed);

  const Icon = collapsed ? ExpandMore : ExpandLess;

  const errorSx = error ? { color: theme => theme.palette.error.main } : undefined;

  if (icon) {
    icon = (
      <Box sx={{ mx: 1, mr: 4, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
    );
  }

  return (
    <div className="flex column">
      <Box sx={{ py: 1, pr: 1 }}>
        <Button onClick={switchCollapsed} sx={{ display: 'flex', width: '100%' }}>
          {icon}
          <Typography
            variant={variant || 'h6'}
            sx={{
              textAlign: 'left',
              flexGrow: 1,
              textTransform: 'capitalize',
              ...errorSx,
            }}
          >
            {title}
          </Typography>
          <Icon size="large" sx={errorSx} />
        </Button>
      </Box>
      <Collapse in={!collapsed}>
        {children}
      </Collapse>
    </div>
  );
}
