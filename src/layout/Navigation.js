import React, { useEffect } from "react";
import clsx from "clsx";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import HistoryIcon from "@material-ui/icons/History";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRightRounded";
import KeyboardArrowLeftIcon from "@material-ui/icons/KeyboardArrowLeftRounded";
import { IconButton, makeStyles, useTheme } from "@material-ui/core";
import Loading from "../components/Loading";
import Skeleton from "@material-ui/lab/Skeleton";
import ConfigService from "../services/ConfigService";
import Subjects, {
  DataTypeSubject,
  EmbeddedAppSubject,
  TabsSubject,
} from "../services/subjects";
import Collapse from "@material-ui/core/Collapse";
import zzip from "../util/zzip";
import { useSpreadState } from "../common/hooks";
import { useMainContext } from "./MainContext";
import Menu from "../config/Menu";
import { DataType } from "../services/DataTypeService";
import FrezzerLoader from "../components/FrezzerLoader";
import { useTenantContext } from "./TenantContext";
import { from } from "rxjs";
import { AppGateway } from "../services/AuthorizationService";
import EmbeddedAppService from "../services/EnbeddedAppService";
import { appBarHeight } from "./AppBar";
import CenitIOLogo from "../img/Cenit_IO_512x512px_Imagotipo.svg";
import CenitAdminLogo from "../img/Cenit_IO_Admin_app_Identidad.svg";

function NavItem({ icon, onClick, disabled, text }) {
  return (
    <ListItem button component="div" disabled={disabled} onClick={onClick}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>
        <div
          style={{
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {text}
        </div>
      </ListItemText>
    </ListItem>
  );
}

function NavSubject({ subject, onClick }) {
  const [state, setState] = useSpreadState();
  const theme = useTheme();

  const { icon, title } = state;

  useEffect(() => {
    const subscription = zzip(
      subject.navIcon(),
      subject.quickNavTitle()
    ).subscribe(([icon, title]) => setState({ icon, title }));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = subject
      .navTitle()
      .subscribe((title) => setState({ title }));
    return () => subscription.unsubscribe();
  }, [subject]);

  let text;
  let navIcon;
  if (title) {
    navIcon = icon;
    text = title;
  } else {
    navIcon = (
      <Skeleton
        variant="circle"
        component="div"
        width={theme.spacing(3)}
        height={theme.spacing(3)}
      />
    );
    text = <Skeleton variante="text" component="div" />;
  }

  return (
    <NavItem icon={navIcon} disabled={!title} text={text} onClick={onClick} />
  );
}

export const navigationWidth = (theme) => `${theme.spacing(30)}px`;

const useStyles = makeStyles((theme) => ({
  drawer: {
    position: "relative",
    boxShadow: "0 9px 4px rgba(0,0,0,0.30)",
    zIndex: 1100,

    background: theme.palette.background.paper,
    order: 0,
  },
  navOpen: {
    width: navigationWidth(theme),
    transition: theme.transitions.create(["width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  navClose: {
    transition: theme.transitions.create(["width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(10) + 5,
  },
}));

const useItemStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.action.selected,
    padding: 0,
  },
}));

function NavGroup({ title, IconComponent, items, open, onClick, onSelect }) {
  const [tenantState] = useTenantContext();

  const { user } = tenantState;

  const userRoles = user.roles || [];

  const isSuperUser =
    user.super_admin_enabled &&
    !!userRoles.find(({ name }) => name === "super_admin");

  const itemClasses = useItemStyles();

  items = (items || []).filter(
    ({ superUser, roles }) =>
      (!superUser || isSuperUser) &&
      (!roles || userRoles.find((role) => roles.includes(role)))
  );

  return (
    <>
      <NavItem text={title} icon={<IconComponent />} onClick={onClick} />
      <Collapse in={open}>
        <List className={itemClasses.root} component="ul">
          {items.map((item, index) => (
            <NavItem
              key={`item_${index}`}
              text={item.title}
              icon={item.icon}
              onClick={() => onSelect(item)}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}

export default function Navigation({ xs, onToggle }) {
  const [mainContextState, setMainContextState] = useMainContext();

  const { docked } = mainContextState;

  const [state, setState] = useSpreadState({
    navigation: ConfigService.state().navigation || [],
    history: true,
    embeddedApps: [],
  });

  const classes = useStyles();

  const itemClasses = useItemStyles();

  const { navigation, over, openIndex, item, embeddedApps } = state;

  useEffect(() => {
    const subscription = EmbeddedAppService.all().subscribe((embeddedApps) =>
      setState({ embeddedApps })
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (item) {
      const subscription = DataType.find(item.$ref).subscribe((dt) => {
        if (xs) {
          setMainContextState({ docked: false });
        }
        if (dt) {
          TabsSubject.next({
            key: DataTypeSubject.for(dt.id).key,
          });
        }
        setState({ item: null });
      });
      return () => subscription.unsubscribe();
    }
  }, [item, xs]);

  useEffect(() => {
    const subscription = ConfigService.navigationChanges().subscribe(
      (navigation) =>
        setTimeout(() =>
          setState({
            navigation: navigation || [],
            disabled: true,
          })
        )
    );
    return () => subscription.unsubscribe();
  }, []);

  const setOver = (over) => setState({ over });

  const select = (key) => () => {
    if (xs) {
      setMainContextState({ docked: false });
    }
    TabsSubject.next({ key });
  };

  const selectItem = (item) => setState({ item });

  let menuItems = Menu.groups.map((group, index) => (
    <NavGroup
      {...group}
      key={`g_${index}`}
      open={index === openIndex}
      onClick={() => setState({ openIndex: index === openIndex ? -1 : index })}
      onSelect={selectItem}
    />
  ));

  const openEmbeddedApp = (id) => () =>
    TabsSubject.next({
      key: EmbeddedAppSubject.for(id).key,
    });

  embeddedApps.forEach(({ id, title }) =>
    menuItems.push(
      <NavSubject
        key={`embedded_app_${id}`}
        subject={EmbeddedAppSubject.for(id)}
        onClick={openEmbeddedApp(id)}
      />
    )
  );

  let nav;
  if (navigation) {
    nav = navigation
      .map(({ key }) => {
        const subject = Subjects[key];
        return (
          subject && (
            <NavSubject
              key={key}
              subject={Subjects[key]}
              onClick={select(key)}
            />
          )
        );
      })
      .filter((item) => item);
    nav = (
      <List
        style={{ overflowX: "hidden", padding: !docked ? "0 0.9rem" : "" }}
        component="ul"
      >
        <ListItem
          button
          component="div"
          onClick={() =>
            setState({ openIndex: openIndex === "recent" ? -1 : "recent" })
          }
        >
          <ListItemIcon>
            <HistoryIcon component="svg" />
          </ListItemIcon>
          <ListItemText>Recent</ListItemText>
        </ListItem>
        <Collapse in={openIndex === "recent"}>
          <List component="ul" classes={itemClasses}>
            {nav}
          </List>
        </Collapse>
        {menuItems}
      </List>
    );
  } else {
    nav = <Loading />;
  }

  const open = docked || over;

  return (
    <div
      className={clsx(classes.drawer, {
        [classes.navOpen]: open,
        [classes.navClose]: !open,
      })}
      style={{
        position: docked ? "relative" : "absolute",
        height: docked && !xs ? "unset" : "100vh",
        minHeight: docked && !xs ? "unset" : "100vh",
        zIndex: "1300",
        marginTop: xs ? "initial" : "-64px",
      }}
    >
      <div
        style={{
          display: "block",
          overflow: xs ? "hidden" : "auto",
          overflowX: !docked ? "hidden" : "auto",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            width: docked ? "90%" : "100%",
            marginLeft: docked ? "" : "1rem",
            padding: docked && !xs ? "1rem 0 1rem 1.8rem" : "",
            boxSizing: docked ? "border-box" : "",
          }}
        >
          {!docked && <img src={CenitIOLogo} width="50px" alt="" />}
          {docked && !xs && <img src={CenitAdminLogo} width="150px" alt="" />}
        </div>
        {nav}
        {item && <FrezzerLoader />}
        {!xs && (
          <div
            style={{
              position: "absolute",
              top: "1rem",
              right: "-14px",
              height: "1.5rem",
              width: "1.5rem",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              borderRadius: "50%",
              boxShadow: "-1px 1px 4px rgba(0,0,0,0.30)",
            }}
          >
            {docked && (
              <IconButton edge="start" color="inherit" onClick={onToggle}>
                <KeyboardArrowLeftIcon />
              </IconButton>
            )}

            {!docked && (
              <IconButton edge="start" color="inherit" onClick={onToggle}>
                <KeyboardArrowRightIcon />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
