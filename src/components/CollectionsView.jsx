import React from "react";
import { useContainerContext } from "../actions/ContainerContext";
import { originBackgroundSx } from "./OriginsColors";
import clsx from "clsx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ImageWithFallback from "./ImageWithFallback";

export default function CollectionsView({ height, width }) {

  const [containerState, setContainerState] = useContainerContext();

  const { data, selectedItems } = containerState;

  const select = selectedItems => setContainerState({ selectedItems });

  const handleSelectOne = item => () => {
    if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
      select([]);
    } else {
      select([item]);
    }
  };

  const cards = data.items.map(item => {
    let isSelected = selectedItems.findIndex(i => i.id === item.id) !== -1;
    return (
      <Box key={item.id}
           onClick={handleSelectOne(item)}
           boxShadow={3}
           sx={{
             m: 3,
             width: theme => theme.spacing(24),
             minHeight: theme => theme.spacing(32),
             cursor: 'pointer',
             background: theme => (isSelected ? theme.palette.action.selected : undefined),
             '&:hover': {
               background: theme => theme.palette.action.hover,
             },
           }}>
        <Typography
                    sx={{ ...originBackgroundSx(item.origin), p: 1, textAlign: 'center' }}
                    variant="subtitle1">
          {item.title}
        </Typography>
        <div className="flex column align-items-center">
          <Box sx={{ p: 2, width: '100%', boxSizing: 'border-box' }}>
            <ImageWithFallback src={item.picture?.public_url}
                               alt={item.title}
                               style={{ width: "100%" }} />
          </Box>
          <Typography variant="caption" sx={{ p: 2, textAlign: 'center' }}>
            {item.summary}
          </Typography>
        </div>
      </Box>
    );
  });

  return (
    <div className={clsx('flex wrap align-items-center justify-content-center border-box')}
         style={{ height: `calc(${height})`, width: `calc(${width})`, overflow: 'auto' }}>
      {cards}
    </div>
  );
}
