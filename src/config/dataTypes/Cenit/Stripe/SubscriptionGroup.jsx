import React from 'react';
// import PlanIcon from "@mui/icons-material/RequestQuote";
import PlanIcon from '@mui/icons-material/MonetizationOn';
// import MenuIcon from "@mui/icons-material/RequestQuoteOutlined";
import MenuIcon from '@mui/icons-material/MonetizationOnOutlined';

const fields = ['name', 'plans'];

export const PlanMenuIcon = MenuIcon;

export default {
  title: 'Subscription Group',
  icon: <PlanIcon component="svg" />,
  actions: {
    index: {
      fields: [...fields, 'updated_at']
    },
    new: {
      fields
    }
  }
};
