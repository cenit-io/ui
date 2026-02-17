import React, { useEffect } from 'react';
import { useMediaQuery, StyledEngineProvider } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import AppBar, { appBarHeight } from './AppBar';
import Navigation, { navigationWidth } from "./Navigation";
import { ThemeProvider, adaptV4Theme, createTheme, useTheme } from '@mui/material/styles';
import Drawer from "../components/Drawer";
import clsx from "clsx";
import Tabs from "./Tabs";
import ConfigService from "../services/ConfigService";
import Subjects, { NavSubject } from "../services/subjects";
import { delay } from "rxjs/operators";
import MainContext, { useMainContext } from "./MainContext";
import TenantContext from "./TenantContext";
import localStorage from '../util/localStorage';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative'
  },
  mainContainer: {
    position: 'relative',
    display: 'flex',
    height: `calc(100vh - ${appBarHeight(theme)})`,
    marginTop: appBarHeight(theme)
  },
  contentMargin: {
    marginLeft: theme.spacing(10) + 5,
  },
  drop: {
    position: 'absolute',
    opacity: 0.5,
    zIndex: 1100, top: 0,
    left: 0,
    background: '#ffffff'
  }
}));

function MainLayout() {
  const [mainContextState, setMainContextState] = useMainContext();

  const classes = useStyles();

  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.down('sm'));

  const { docked } = mainContextState;
  const setDocked = docked => setMainContextState({ docked });

  useEffect(() => {
    const subscription = NavSubject.pipe(
      delay(3000)
    ).subscribe(
      key => {
        const sub = Subjects[key];
        if (sub) {
          let navigation = [...(ConfigService.state().navigation || [])];
          let notFound = true;
          navigation.forEach(
            e => {
              if (e.key === key) {
                notFound = false;
                e.hits = (e.hits || 0) - navigation.length;
              } else {
                e.hits = (e.hits || 0) + 1;
              }
            }
          );
          if (notFound) {
            const sort = [...navigation];
            sort.sort((s1, s2) => (s1.hits || 0) - (s2.hits || 0));
            sort.splice(10, navigation.length - 10);
            navigation = navigation.filter(s => sort.find(({ key }) => key === s.key));
            navigation.push({ key, hits: 0 });
          }
          ConfigService.update({ navigation });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  let navKey;
  if (xs) {
    navKey = `nav_${ConfigService.state().tenant_id}`;
  }

  const switchNavigation = () => {
    localStorage.set('docked', String(!docked));
    setDocked(!docked);
  };

  let navigationUI = <Navigation key={navKey}
                                 xs={xs}
                                 onToggle={switchNavigation} />;

  if (xs) {
    navigationUI = (
      <Drawer onClose={switchNavigation}>
        {navigationUI}
      </Drawer>
    );
  }

  const navWidth = xs ? 0 : (docked ? navigationWidth(theme) : `calc(${theme.spacing(10)} + 5px)`);
  const tabsWidth = navWidth ? `100vw - ${navWidth}` : '100vw';

  return (
    <div className={classes.root}>
      <div className={classes.mainContainer}>
        <div className={clsx(!(xs || docked) && classes.contentMargin)}
             style={{
               flexGrow: 1,
               order: 1,
               width: `calc(${tabsWidth})`
             }}>
          <Tabs docked={docked}
                width={tabsWidth} />
        </div>
        {
          navigationUI
        }
      </div>
      <AppBar onToggle={switchNavigation} />
    </div>
  );
}

// grey
const theme = createTheme(adaptV4Theme({
  palette: {
    primary: {
      main: '#212121'
    },
    secondary: {
      main: '#212121'
    }
  },
}));

export default function Main() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <MainContext>
          <TenantContext>
            <MainLayout />
          </TenantContext>
        </MainContext>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
