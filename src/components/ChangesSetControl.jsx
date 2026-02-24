import React, { useEffect, useState } from 'react';
import Box from "@mui/material/Box";
import * as Diff from 'diff';
import Collapsible from "./Collapsible";

function toStr(value) {
  const type = typeof value;
  if (type === 'undefined' || type === 'object') {
    if (value) {
      return JSON.stringify(value, null, 2);
    }
    return '';
  }

  return String(value);
}

export default function ChangesSetControl({
  title,
  value,
  disabled,
  readOnly,
  error,
  onChange,
  property
}) {
  const [diffs, setDiffs] = useState({});

  useEffect(() => {
    const subscription = value.changed().subscribe(
      changesSet => {
        const diffs = {};
        Object.keys(changesSet || {}).forEach(field => {
          diffs[field] = Diff.diffLines(
            toStr(changesSet[field][0]),
            toStr(changesSet[field][1]), {
              newlineIsToken: true
            }
          );
        });
        setDiffs(diffs);
      }
    );

    value.changed().next(value.get());

    return () => subscription.unsubscribe();
  }, [value]);

  const fields = Object.keys(diffs).map(field => {
    const lines = [];
    diffs[field].forEach((part, i) => {
      const klass = (part.added && 'added') || (part.removed && 'removed') || 'unchanged';
      part.value.match(/[^\r\n]+/g)?.forEach((l, j) => lines.push(
        <Box
          component="li"
          key={`field_diff_${i}_${j}`}
          sx={{
            py: 1,
            ...(klass === 'added' ? { background: '#dfd', color: '#080' } : {}),
            ...(klass === 'removed' ? { background: '#fee', color: '#b00' } : {}),
            ...(klass === 'unchanged'
              ? {
                background: theme => theme.palette.background.paper,
                color: theme => theme.palette.getContrastText(theme.palette.background.paper),
              }
              : {}),
            '&:hover': {
              background: '#ffc',
            },
            '& span': {
              whiteSpace: 'pre-wrap',
              fontFamily: 'courier',
              display: 'inline-block',
              fontWeight: 400,
              fontSize: 14,
            },
            '& span::before': {
              content: klass === 'added' ? '" +"' : klass === 'removed' ? '" -"' : '"  "',
              pr: 1,
            },
          }}
        >
          <Box component="span">
            {l}
          </Box>
        </Box>
      ));
    });
    return (
      <Collapsible title={field}
                   variant="subtitle1"
      >
        <Box
          component="ul"
          sx={{
            listStyleType: 'none',
            p: 0,
            border: theme => `solid 1px ${theme.palette.text.disabled}`,
          }}
        >
          {lines}
        </Box>
      </Collapsible>
    )
  });

  return (
    <>
      {fields}
    </>
  );
}
