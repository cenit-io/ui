import React from 'react';
import { Box, Toolbar, Typography, Chip } from "@mui/material";
import { appBarHeight } from "../layout/AppBar";
import ActionPicker from "./ActionPicker";
import { ActionKind } from "./ActionRegistry";
import { useContainerContext } from "./ContainerContext";
import Index from "./Index";
import Filter, { FilterIcon } from "./Filter";
import IconButton from "@mui/material/IconButton";
import localStorage from '../util/localStorage'

function CollectionActionsToolbar({ dataType, title, selectedKey, onSubjectPicked }) {

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
                 sx={(theme) => ({
                   backgroundColor: theme.palette.background.default,
                   color: theme.palette.text,
                   textTransform: "uppercase",
                   border: `2px solid ${theme.palette.text.secondary}`,
                   borderRadius: "4px",
                 })}
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
                       <IconButton
                         size="small"
                         sx={(theme) => ({
                           color: theme.palette.getContrastText(theme.palette.secondary.main),
                         })}>
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

  const mainSectionTitle = localStorage.get(`${dataType.name}`);

  return (
    <Toolbar
             sx={(theme) => ({
               display: 'flex',
               pl: theme.spacing(1),
               pr: 0,
               height: appBarHeight(theme),
               backgroundColor: theme.palette.background.default,
               [theme.breakpoints.up('sm')]: {
                 pl: theme.spacing(4),
                 pr: theme.spacing(4),
               },
             })}
             component="div">
      <Box
        sx={(theme) => ({
          flex: '0 0 auto',
          color: theme.palette.primary.dark,
          maxWidth: 'calc(100vw - 190px)',
        })}>
        <Typography variant="h6"
                    sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                    component="h6">
          {mainSectionTitle && `${mainSectionTitle} |`} {title} {breadcrumbActionName && ` | ${breadcrumbActionName}`}
        </Typography>
      </Box>
      <Box className="grow-1" />
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
