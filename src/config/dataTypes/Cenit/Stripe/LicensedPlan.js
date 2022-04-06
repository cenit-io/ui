import React from 'react';
import PlanIcon from "@material-ui/icons/RequestQuote";
import MenuIcon from "@material-ui/icons/RequestQuoteOutlined";

const fields = ['id', 'nickname', 'product', 'interval', 'currency', 'amount'];

export const PlanMenuIcon = MenuIcon;

export default {
    title: 'Licensed Plan',
    icon: <PlanIcon component="svg"/>,
    actions: {
        index: {
            fields: [...fields, 'updated_at']
        },
        new: {
            fields
        }
    }
};
