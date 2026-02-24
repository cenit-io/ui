import React from 'react';
import Typography from "@mui/material/Typography";

const ErrorMessages = ({ errors, position, children }) => {
  const errorMsgs = (((errors && errors.constructor === Array) ? errors : (errors && errors.$)) || [])
    .map((msg, index) => <Typography key={`msg${index}`}
                                     sx={(theme) => ({ color: theme.palette.error.main })}
                                     variant="caption"
                                     display="block"
                                     gutterBottom>
        {msg}
      </Typography>
    );


  return <React.Fragment>
    {position === 'top' && errorMsgs}
    {children}
    {(!position || position !== 'top') && errorMsgs}
  </React.Fragment>;
};

export default ErrorMessages;
