import React, { useEffect } from 'react';
import API from "../services/ApiService";
import Loading from "./Loading";
import clsx from "clsx";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { RecordSubject, TabsSubject } from "../services/subject";
import zzip from "../util/zzip";
import { DataType } from "../services/DataTypeService";
import { useSpreadState } from "../common/hooks";
import InfoAlert from "../actions/InfoAlert";
import { ActiveTenantIconFilled } from "../config/dataTypes/Cenit/ActiveTenant";

export default function ActiveTenants({ dataType, onSubjectPicked }) {

  const [state, setState] = useSpreadState();

  const { tenantDataType, items } = state;

  useEffect(() => {
    const subscription = zzip(
      DataType.find({ namespace: '', name: 'Account' }),
      API.get('setup', 'data_type', dataType.id, 'digest', 'list')
    ).subscribe(
      ([tenantDataType, items]) => {
        items.sort((a, b) => (a.tasks || 0) - (b.tasks || 0));
        setState({ tenantDataType, items });
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  const openTenant = tenant => () => onSubjectPicked(RecordSubject.for(tenantDataType.id, tenant.id).key);

  if (items) {
    if (items.length) {
      const activeTenants = items.map(({ tenant, tasks }) => (
        <Card key={tenant.id}
          sx={(theme) => ({
            pt: theme.spacing(1),
            cursor: 'pointer',
            '&:hover': {
              background: theme.palette.background.default
            },
            my: theme.spacing(1),
          })}
          onClick={openTenant(tenant)}>
          <CardContent className="flex">
            <Typography variant="subtitle1" sx={(theme) => ({ mr: theme.spacing(2) })}>
              {tenant.name}
            </Typography>
            <Chip label={tasks} />
          </CardContent>
        </Card>
      ));

      return (
        <Box className={clsx("flex wrap align-items-center space-around")} sx={(theme) => ({ p: theme.spacing(1) })}>
          {activeTenants}
        </Box>
      );
    }

    return <InfoAlert mainIcon={ActiveTenantIconFilled}
      title="No active tenants" />
  }

  return <Loading />;
}
