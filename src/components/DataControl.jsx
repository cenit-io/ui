import React, { useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import makeStyles from '@mui/styles/makeStyles';
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import UploadIcon from "@mui/icons-material/CloudUpload";
import PlainDataIcon from "@mui/icons-material/Edit";
import DropFileControl from "./DropFileControl";
import StringCodeControl from "./StringCodeControl";
import Link from "@mui/material/Link";

const useStyles = makeStyles(theme => ({
  switchLink: {
    color: theme.palette.text.secondary,
    textAlign: 'center',
    padding: theme.spacing(2, 1)
  },
  icon: {
    marginLeft: theme.spacing(1)
  }
}));

export default function DataControl(props) {
  const { value, fileEntryName, plainDataEntryName, onChange } = props;

  const [state, setState] = useSpreadState({ type: 'file' });

  const classes = useStyles();

  const { type } = state;

  useEffect(() => {
    value.set({ type });
  }, [type]);

  const switchType = () => setState({ type: type === 'file' ? 'plain_data' : 'file' });

  const handleChange = () => onChange && onChange(value.get());

  let control;
  let switchMsg;
  if (type === 'file') {
    switchMsg = 'Switch to type or paste a plain data';
    control = <DropFileControl {...props}
                               value={value.propertyValue(fileEntryName || 'file')}
                               onChange={handleChange} />;
  } else {
    control = <StringCodeControl {...props}
                                 value={value.propertyValue(plainDataEntryName || 'plain_data')}
                                 onChange={handleChange} />;
    switchMsg = 'Switch to upload a file';
  }

  const Icon = type === 'file' ? PlainDataIcon : UploadIcon;
  return (
    <div className="flex column justify-content-center">
      {control}
      <Link href="#"
            onClick={switchType}
            className={clsx('flex align-items-center justify-content-center', classes.switchLink)}>
        <Typography variant="caption">
          {switchMsg}
        </Typography>
        <Icon className={classes.icon}
              fontSize="small" />
      </Link>
    </div>
  );
}
