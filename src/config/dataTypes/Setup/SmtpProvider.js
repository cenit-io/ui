import React from 'react';
import SmtpProviderIcon from "@material-ui/icons/Email";

const fields = ['namespace', 'name', 'address', 'port', 'domain', 'enable_starttls_auto'];

export default {
  title: 'SMTP Provider',
  icon: <SmtpProviderIcon component="svg" />,
  actions: {
    index: {
      fields: [...fields, 'updated_at']
    },
    new: {
      fields,
      seed: {
        address: 'smtp.gmail.com',
        port: 587,
        domain: 'gmail.com',
        enable_starttls_auto: true
      }
    }
  }
};
