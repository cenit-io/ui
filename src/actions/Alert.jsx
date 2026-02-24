import React from "react";
import clsx from "clsx";
import DefaultMainIcon from "@mui/icons-material/LinkOff";
import DefaultSmallIcon from "@mui/icons-material/Cancel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material";
import ResponsiveContainer from "../components/ResponsiveContainer";

const DefaultIconColor = [
  'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
].reduce((hash, color) => (hash[color] = true) && hash, {});

export default function Alert(
  { title, message, children, mainIcon, mainIconColor, smallIcon, smallIconColor, background }
) {
  const theme = useTheme();

  const MainIcon = mainIcon || DefaultMainIcon;
  const SmallIcon = smallIcon || DefaultSmallIcon;

  background = background || theme.palette.error.light;

  smallIconColor = smallIconColor || 'error';

  mainIconColor = DefaultIconColor[mainIconColor]
    ? { color: mainIconColor }
    : { style: { color: mainIconColor } };

  smallIconColor = DefaultIconColor[smallIconColor]
    ? { color: smallIconColor }
    : { style: { color: smallIconColor } };

  return (
    <ResponsiveContainer>
      <Box
        key='successAlert'
        className={clsx("flex column align-items-center")}
        sx={{
          height: '100%',
          overflow: 'auto',
          background: theme => theme.palette.background.default,
          p: 3,
        }}
      >
        <Box
          className="flex column align-items-center"
          sx={{
            width: '100px',
            minHeight: '100px',
            borderRadius: '50%',
            position: 'relative',
            mt: 3,
            mb: 3,
            justifyContent: 'center',
            background,
          }}
        >
          <SmallIcon
            sx={{
              position: 'absolute',
              top: '8px',
              right: 0,
              background: theme => theme.palette.background.paper,
              borderRadius: '50%',
            }}
            {...smallIconColor}
          />
          <MainIcon fontSize='large' {...mainIconColor} />
        </Box>
        <Typography variant='h5' className="flex align-items-center">
          {title}
        </Typography>
        <Typography variant='subtitle1' sx={{ textAlign: 'center' }}>
          {message}
        </Typography>
        <Box sx={{ textAlign: 'center', p: 1, width: theme => `calc(100% - ${theme.spacing(6)})` }}>
          {children}
        </Box>
      </Box>
    </ResponsiveContainer>
  );
}
