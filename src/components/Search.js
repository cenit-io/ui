import React from 'react';
import { makeStyles } from "@material-ui/core";
import { fade } from '@material-ui/core/styles/colorManipulator';
import RecordSelector from "../components/RecordSelector";
import SearchIcon from '@material-ui/icons/Search';

const useStyles = makeStyles(theme => ({
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: ({ backColor }) => backColor || fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: ({ backOverColor }) => backOverColor || fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: 200,
    },
  }
}));

export default function ({ disabled, dataTypeSelector, onSelect, searchIcon, selectorComponent, backColor, backOverColor }) {

  const classes = useStyles({ backColor, backOverColor });
  const inputClasses = {
    root: classes.inputRoot,
    input: classes.inputInput,
  };

  const Selector = selectorComponent || RecordSelector;

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        {searchIcon || <SearchIcon />}
      </div>
      <Selector dataTypeSelector={dataTypeSelector}
                onSelect={onSelect}
                inputClasses={inputClasses}
                disabled={disabled} />
    </div>
  )
};
