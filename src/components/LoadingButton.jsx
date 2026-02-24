import React from 'react';
import Box from '@mui/material/Box';
import clsx from 'clsx';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';

export default function LoadingButton({ loading, success, onClick, className, actionIcon }) {
  const rootClassname = clsx(className);

  return (
    <Box className={rootClassname} sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ m: 1, position: 'relative' }}>
        <Fab aria-label="save"
             color="primary"
             sx={(theme) => (loading ? { backgroundColor: theme.palette.primary.light } : {})}
             onClick={() => !(loading || success) && onClick()}>
          {success ? <CheckIcon component="svg" /> : actionIcon || <SaveIcon component="svg" />}
        </Fab>
        {loading && (
          <CircularProgress
            size={68}
            sx={(theme) => ({
              color: theme.palette.primary.main,
              position: 'absolute',
              top: -6,
              left: -6,
              zIndex: 1101,
            })}
          />
        )}
      </Box>
    </Box>
  );
}
