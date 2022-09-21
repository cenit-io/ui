import React, { useEffect } from "react";
import clsx from "clsx";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import HistoryIcon from "@material-ui/icons/History";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRightRounded";
import KeyboardArrowLeftIcon from "@material-ui/icons/KeyboardArrowLeftRounded";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUp from "@material-ui/icons/KeyboardArrowUp";
import { IconButton, makeStyles, Typography, useTheme } from "@material-ui/core";
import Loading from "../components/Loading";
import Skeleton from "@material-ui/lab/Skeleton";
import ConfigService from "../services/ConfigService";
import Subjects, {
  DataTypeSubject,
  EmbeddedAppSubject,
  MenuSubject,
  TabsSubject,
} from "../services/subjects";
import Collapse from "@material-ui/core/Collapse";
import zzip from "../util/zzip";
import localStorage from '../util/localStorage'
import { useSpreadState } from "../common/hooks";
import { useMainContext } from "./MainContext";
import Menu from "../config/Menu";
import { DataType } from "../services/DataTypeService";
import FrezzerLoader from "../components/FrezzerLoader";
import { isSuperAdmin, useTenantContext } from "./TenantContext";
import EmbeddedAppService from "../services/EnbeddedAppService";

function NavItem({ icon, onClick, disabled, text, isRoot, isOpen }) {
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
      {isRoot && (
        <div>
          <IconButton color="inherit" size="small">
            {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </div>
      )}
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

export const navigationWidth = (theme) => `${theme.spacing(35)}px`;

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
    boxSizing: "border-box",
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
  brandImg: {
    cursor: "pointer",
    marginLeft: "1.35rem",
    marginBottom: "1.3rem",
    width: "100%"
  },
  brandImgWrapper: {
    width: "43px"
  },
  brandText: {
    fontWeight: "800",
    marginLeft: "1.8rem",
    cursor: "pointer",
    lineHeight: "0.85",
    fontSize: "1.8rem"
  },
  brandContainer: {
    backgroundColor: theme.palette.background.paper,
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    zIndex: "1400",
    width: "100%",
    display: "flex",
    justifyContent: "start",
    padding: "0.7rem 0 0 0",
  },
  btnToggle: {
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
    zIndex: 1500,
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

  const isSuperUser = isSuperAdmin(user);

  const itemClasses = useItemStyles();

  items = (items || []).filter(
    ({ superUser, roles }) =>
      (!superUser || isSuperUser) &&
      (!roles || userRoles.find((role) => roles.includes(role)))
  );

  return (
    <>
      <NavItem
        text={title}
        icon={<IconComponent />}
        onClick={onClick}
        isRoot={true}
        isOpen={open}
      />
      <Collapse in={open}>
        <List className={itemClasses.root} component="ul">
          {items.map((item, index) => (
            <NavItem
              key={`item_${index}`}
              text={item.title}
              icon={item.icon}
              onClick={() => onSelect(item, title)}
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

  const handleHomeAccess = () =>
    TabsSubject.next({
      key: MenuSubject.instance().key,
    });

  const select = (key) => () => {
    if (xs) {
      setMainContextState({ docked: false });
    }
    TabsSubject.next({ key });
  };

  const selectItem = (item, text) => {
    localStorage.set(`${item.$ref.name}`, text);
    setState({ item });
  };

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
        style={{
          overflowX: "hidden",
          padding: "0 0.9rem",
          margin: "-0.15rem 0",
        }}
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

  const BrandLogo = () => (
    <div className={classes.brandContainer}>
      <div className={classes.brandImgWrapper}>
        {!xs && (
          <img
            src="https://server.cenit.io/images/brandLogo.svg"
            alt="Brand Logo"
            onClick={handleHomeAccess}
            className={classes.brandImg}
          />
        )}
      </div>
      {open && !xs && (
        <Typography variant="h5" className={classes.brandText} onClick={handleHomeAccess}>
          Cenit IO
        </Typography>
      )}
    </div>
  );

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
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
    >
      <div
        style={{
          display: "block",
          overflow: xs ? "hidden" : "auto",
          overflowX: !docked ? "hidden" : "auto",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <BrandLogo />
        {nav}
        {item && <FrezzerLoader />}
        {!xs && (
          <div className={classes.btnToggle}>
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
