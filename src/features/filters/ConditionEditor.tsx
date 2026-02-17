import React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { conditionLabel } from "./ConditionModel";

type ConditionEditorProps = {
  disabled?: boolean;
  labelKey: string;
  menuAnchor: HTMLElement | null;
  options: string[];
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onSelect: (key: string) => void;
};

export default function ConditionEditor({
  disabled,
  labelKey,
  menuAnchor,
  options,
  onOpen,
  onClose,
  onSelect,
}: ConditionEditorProps) {
  return (
    <>
      <Button onClick={onOpen} disabled={disabled}>
        {conditionLabel(labelKey)}
      </Button>
      <Menu open={Boolean(menuAnchor)} anchorEl={menuAnchor} onClose={onClose}>
        {options.map((option) => (
          <MenuItem key={option} onClick={() => onSelect(option)}>
            {conditionLabel(option)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
