import React, { useEffect } from 'react';
import API from "../services/ApiService";
import Loading from "./Loading";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import { RecordSubject } from "../services/subjects";
import zzip from "../util/zzip";
import { DataType } from "../services/DataTypeService";
import { useSpreadState } from "../common/hooks";
import InfoAlert from "../actions/InfoAlert";
import { ActiveTenantIconFilled } from "../config/dataTypes/Cenit/ActiveTenant";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1)
  },
  card: {
    paddingTop: theme.spacing(1),
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.background.default
    },
    margin: theme.spacing(1, 0)
  },
  tenant: {
    marginRight: theme.spacing(2)
  }
}));

export default function ActiveTenants({ dataType, onSubjectPicked }) {

  const [state, setState] = useSpreadState();

  const { tenantDataType, items } = state;

  const classes = useStyles();

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
              className={classes.card}
              onClick={openTenant(tenant)}>
          <CardContent className="flex">
            <Typography variant="subtitle1" className={classes.tenant}>
              {tenant.name}
            </Typography>
            <Chip label={tasks} />
          </CardContent>
        </Card>
      ));

      return (
        <div className={clsx("flex wrap align-items-center space-around", classes.root)}>
          {activeTenants}
        </div>
      );
    }

    return <InfoAlert mainIcon={ActiveTenantIconFilled}
                      title="No active tenants" />
  }

  return <Loading />;
}
