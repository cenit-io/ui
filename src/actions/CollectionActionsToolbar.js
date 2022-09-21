import React from 'react';
import { makeStyles, Toolbar, Typography, Chip } from "@material-ui/core";
import { appBarHeight } from "../layout/AppBar";
import ActionPicker from "./ActionPicker";
import { ActionKind } from "./ActionRegistry";
import { useContainerContext } from "./ContainerContext";
import Index from "./Index";
import Filter, { FilterIcon } from "./Filter";
import IconButton from "@material-ui/core/IconButton";

const useToolbarStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(0),
    height: appBarHeight(theme),
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    },
  },
  title: {
    flex: '0 0 auto',
    color: theme.palette.primary.dark,
    maxWidth: () => `calc(100vw - 190px)`,
  },
  titleText: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  filterIcon: {
    color: theme.palette.getContrastText(theme.palette.secondary.main)
  },
  selectedChip: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text,
    textTransform: "uppercase",
    border: `2px solid ${theme.palette.text.secondary}`,
    borderRadius: "4px"
  }
}));

function CollectionActionsToolbar({ dataType, title, selectedKey, onSubjectPicked }) {

  const classes = useToolbarStyles();

  const containerContext = useContainerContext();

  const [containerState, setContainerState] = containerContext;

  const { selectedItems, data, selector, breadcrumbActionName, handleAction } = containerState;

  const clearSelection = () => {
    if (selectedItems.length) {
      setContainerState({ selectedItems: [] });
      handleAction(dataType, Index.key, onSubjectPicked);
    } else if (Object.keys(selector).length) {
      setContainerState({ actionKey: Filter.key });
    }
  };

  let chip;
  if (selectedItems.length) {
    chip = <Chip label={`${selectedItems.length} selected`}
                 component="div"
                 onDelete={clearSelection}
                 className={classes.selectedChip}
    />;
  } else {
    if (data) {
      const selection = Object.keys(selector).length;
      if (selection) {
        const msg = data.count
          ? `found ${data.count}`
          : 'no records found';
        chip = <Chip label={msg}
                     component="div"
                     color='secondary'
                     onDelete={clearSelection}
                     onClick={clearSelection}
                     deleteIcon={(
                       <IconButton size="small" className={classes.filterIcon}>
                         <FilterIcon />
                       </IconButton>
                     )} />;
      } else {
        const msg = data.count
          ? `about ${data.count}`
          : 'no records found';
        chip = <Chip label={msg} component="div" />;
      }
    }
  }

  const mainSectionTitle = localStorage.getItem(`${dataType.name}`);

  return (
    <Toolbar className={classes.root}
             component="div">
      <div className={classes.title}>
        <Typography variant="h6"
                    className={classes.titleText}
                    component="h6">
          {mainSectionTitle && `${mainSectionTitle} |`} {title} {breadcrumbActionName && ` | ${breadcrumbActionName}`}
        </Typography>
      </div>
      <div className="grow-1" />
      {chip}
      <ActionPicker kind={ActionKind.collection}
                    arity={selectedItems.length}
                    onAction={actionKey => handleAction(dataType, actionKey, onSubjectPicked)}
                    selectedKey={selectedKey}
                    dataType={dataType} />
    </Toolbar>
  );
}

export default CollectionActionsToolbar;
