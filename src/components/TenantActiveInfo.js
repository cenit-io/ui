import { Button, IconButton, makeStyles, Paper } from "@material-ui/core";
import { CancelRounded, KeyboardArrowDown } from "@material-ui/icons";
import { React, useState, useEffect } from "react";
import { useTenantContext } from "../layout/TenantContext";

export default function TenantActiveInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlur, setIsBLur] = useState(true);

  const [tenantState] = useTenantContext();
  const { tenant } = tenantState;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleBLur = () => {
    setIsBLur(false);
  };

  useEffect(() => {
    setIsBLur(true);
  }, [tenant]);

  const useStyles = makeStyles((theme) => ({
    container: {
      position: "relative",
      marginLeft: "0",
    },
    btnClose: {
      position: "absolute",
      top: "-0.5rem",
      right: "-8px",
      height: "1.5rem",
      width: "1.5rem",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      borderRadius: "50%",
      boxShadow: "-1px 1px 4px rgba(0,0,0,0.30)",
      zIndex: 1500,
    },
    paperWrapper: {
      position: "absolute",
      background: "white",
      border: "gray",
      zIndex: 1101,
      right: "0",
      top: "0",
      width: "max-content",
      "& spam": {
        fontWeight: "bold",
      },
    },
    paperContent: {
      width: " 100%",
      boxSizing: "border-box",
      padding: "1rem",
    },
    btnShowBlur: {
      position: "absolute",
      bottom: "20px",
      left: "20%",
      backgroundColor: theme.palette.background.paper,
    },
    textBlur: {
      color: isBlur ? "transparent" : "initial",
      textShadow: isBlur ? "0 0 5px rgba(0,0,0,0.5)" : "none",
    },
  }));

  const classes = useStyles();

  return (
    <>
      <div className={classes.container}>
        Tenant
        <IconButton color="inherit" onClick={handleToggle} size={"small"}>
          <KeyboardArrowDown />
        </IconButton>
        {isOpen && (
          <Paper className={classes.paperWrapper}>
            <div className={classes.paperContent}>
              <div className={classes.btnClose}>
                <IconButton edge="start" variant="small" onClick={handleToggle}>
                  <CancelRounded />
                </IconButton>
              </div>
              <h3> Cenit API v2</h3>
              <p>
                <spam> Name: </spam> {tenant.name}
              </p>
              <p>
                <spam> Key: </spam> {tenant.key}
              </p>
              <p className={classes.textBlur}>
                <spam> Token: </spam> {tenant.token}
              </p>
            </div>
            {isBlur && (
              <Button
                variant="contained"
                onClick={handleBLur}
                className={classes.btnShowBlur}
              >
                Reveal live token
              </Button>
            )}
          </Paper>
        )}
      </div>
    </>
  );
}
