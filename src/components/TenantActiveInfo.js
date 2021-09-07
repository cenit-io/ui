import { IconButton, makeStyles, Paper } from "@material-ui/core";
import { CancelRounded, KeyboardArrowDown } from "@material-ui/icons";
import React from "react";
import { useState } from "react";
import { useTenantContext } from "../layout/TenantContext";

export default function TenantActiveInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const [tenantState] = useTenantContext();
  const { tenant } = tenantState;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const useStyles = makeStyles((theme) => ({
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
			'& spam': {
				fontWeight: 'bold'
			}
    },
    paperContent: {
      width: " 100%",
      boxSizing: "border-box",
      padding: "1rem",
    },
  }));

  const classes = useStyles();

  return (
    <>
      <div style={{ position: "relative", marginLeft: "0" }}>
        <IconButton color="inherit" onClick={handleToggle} size={"small"}>
          <KeyboardArrowDown />
        </IconButton>

        {isOpen && (
          <Paper className={classes.paperWrapper}>
            <div className={classes.paperContent}>
              <div className={classes.btnClose}>
                <IconButton
                  color="inherit"
                  edge="start"
                  variant="small"
                  onClick={handleToggle}
                >
                  <CancelRounded />
                </IconButton>
              </div>
              <p> <spam> Name: </spam> {tenant.name} </p>
              <p> <spam> Key: </spam> {tenant.key} </p>
              <p> <spam> Token: </spam> {tenant.token} </p>
            </div>
          </Paper>
        )}
      </div>
    </>
  );
}
