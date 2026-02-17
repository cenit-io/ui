import React, { useMemo, useState } from "react";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import Box from "@mui/material/Box";

export default function ImageWithFallback({ src, alt = "", className, style = {} }) {
  const [broken, setBroken] = useState(!src);
  const resolvedSrc = useMemo(() => (src && src !== "broken" ? src : null), [src]);

  if (broken || !resolvedSrc) {
    return (
      <Box
        className={className}
        style={style}
        sx={{
          alignItems: "center",
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
          display: "flex",
          justifyContent: "center",
          minHeight: 140,
          width: "100%",
        }}
      >
        <BrokenImageOutlinedIcon color="disabled" fontSize="large" />
      </Box>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}

