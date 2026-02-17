import React from 'react';
// import PlanIcon from "@mui/icons-material/RequestQuote";
import PlanIcon from '@mui/icons-material/MonetizationOn';
// import MenuIcon from "@mui/icons-material/RequestQuoteOutlined";
import MenuIcon from '@mui/icons-material/MonetizationOnOutlined';

const fields = ['id', 'nickname', 'product', 'interval', 'currency', 'amount', 'summary', 'description', 'enabled'];

export const PlanMenuIcon = MenuIcon;

export default {
  title: 'Metered Plan',
  icon: <PlanIcon component="svg" />,
  actions: {
    index: {
      fields: [...fields, 'updated_at']
    },
    new: {
      fields
    }
  },
};
