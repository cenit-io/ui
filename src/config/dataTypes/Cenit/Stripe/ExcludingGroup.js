import React from 'react';
// import PlanIcon from "@material-ui/icons/RequestQuote";
import PlanIcon from '@material-ui/icons/MonetizationOn';
// import MenuIcon from "@material-ui/icons/RequestQuoteOutlined";
import MenuIcon from '@material-ui/icons/MonetizationOnOutlined';

const fields = ['name', 'plans'];

export const PlanMenuIcon = MenuIcon;

export default {
  title: 'Excluding Group',
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
