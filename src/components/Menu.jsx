import React, { useEffect } from 'react';
import Loading from "./Loading";
import { alpha, useTheme } from "@mui/material/styles";
import clsx from "clsx";
import { DataTypeSubject, TabsSubject } from "../services/subjects";
import { DataType } from "../services/DataTypeService";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Search from "./Search";
import { DataTypeSelector } from "../layout/AppBar";
import FrezzerLoader from "./FrezzerLoader";
import { useSpreadState } from "../common/hooks";
import { useTenantContext } from "../layout/TenantContext";

export default function ({ subject, height }) {

  const [state, setState] = useSpreadState();
  const theme = useTheme();

  const [tenantState] = useTenantContext();

  const { user } = tenantState;

  const userRoles = user.roles || [];

  const isSuperUser = user.super_admin_enabled && !!userRoles.find(({ name }) => name === 'super_admin');

  const { config, item } = state;

  useEffect(() => {
    const subscription = subject.config().subscribe(
      config => setState({ config })
    );
    subject.computeTitle();
    return () => subscription.unsubscribe();
  }, [subject]);

  useEffect(() => {
    if (item) {
      const subscription = DataType.find(item.$ref).subscribe(
        dt => {
          if (dt) {
            TabsSubject.next({
              key: DataTypeSubject.for(dt.id).key
            });
          }
          setState({ item: null });
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [item]);

  if (!config) {
    return <Loading />;
  }

  const handleSelect = item => () => setState({ item });

  const handleDataTypeSelected = ({ id }) => TabsSubject.next({
    key: DataTypeSubject.for(id).key
  });

  const userConfig = {
    ...config,
    groups: (config.groups || []).map(group => ({
      ...group,
      items: (group.items || []).filter(
        ({ superUser, roles }) => (
          (!superUser || isSuperUser) &&
          (!roles || userRoles.find(role => roles.includes(role)))
        )
      )
    }))
  };

  const groups = userConfig.groups.sort(
    (g1, g2) => g1.items.length - g2.items.length
  ).map(
    (group, gIndex) => {
      const items = group.items.map(
        (item, iIndex) => (
          <ListItem button
                    component="li"
                    key={`g_${gIndex}_${iIndex}`}
                    sx={{
                      '& + &': {
                        borderTop: theme => `solid 1px ${theme.palette.text.disabled}`,
                      },
                    }}
                    onClick={handleSelect(item)}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        )
      );

      const { IconComponent } = group;

      return (
        <div key={`g_${gIndex}`}>
          <Box
            className={clsx('column')}
            sx={{
              m: 1,
              boxShadow: '0 4px 8px 0 rgba(55, 71, 79, .3)',
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
              width: '80vw',
              [theme.breakpoints.up('sm')]: {
                width: 'auto',
              },
            }}
          >
            <Box
              className={clsx('flex align-items-center')}
              sx={{
                px: 6,
                py: 1.5,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
                background: theme => alpha(theme.palette.primary.main, 0.85),
                color: theme => theme.palette.getContrastText(theme.palette.primary.main),
              }}
            >
              <IconComponent />
              <Box sx={{ ml: 4, fontWeight: 'bold' }}>
                {group.title}
              </Box>
            </Box>
            <Box
              sx={{
                pt: 1,
                pb: 0,
                px: 4,
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
                background: theme => theme.palette.background.paper,
              }}
            >
              <List
                component="ul"
                sx={{
                  background: theme => theme.palette.background.paper,
                  borderRadius: 1,
                }}
              >
                {items}
              </List>
            </Box>
          </Box>
        </div>
      )
    }
  );

  let loader;
  if (item) {
    loader = <FrezzerLoader />;
  }

  return (
    <div className="relative" style={{ height: `calc(${height})` }}>
      <Box
        className="flex"
        sx={{
          position: 'absolute',
          width: '100%',
          height: theme => theme.spacing(8),
          alignItems: 'center',
          background: theme => theme.palette.background.default,
          top: 0,
        }}
      >
        <Typography variant="h6" component="h6" sx={{ px: 2 }}>
          Menu
        </Typography>
        <div className="grow-1" />
        <Search dataTypeSelector={DataTypeSelector}
                backColor="#ffffff"
                backOverColor="#fffffe"
                onSelect={({ record }) => handleDataTypeSelected(record)} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: theme => theme.spacing(8),
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          overflowY: 'auto',
          backgroundColor: theme => theme.palette.background.default,
        }}
        style={{ height: `calc(${height} - ${theme.spacing(8)})` }}
      >
        {groups}
      </Box>
      {loader}
    </div>
  );
}
