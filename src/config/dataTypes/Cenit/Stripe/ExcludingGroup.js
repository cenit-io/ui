import React from 'react';
import PlanIcon from "@material-ui/icons/RequestQuote";
import MenuIcon from "@material-ui/icons/RequestQuoteOutlined";

const fields = ['name', 'plans'];

export const PlanMenuIcon = MenuIcon;

export default {
    title: 'Excluding Group',
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
