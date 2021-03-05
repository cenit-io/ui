import React from 'react';
import ActiveTenants from "../../../components/ActiveTenants";
import Index from "../../../actions/Index";
import SvgIcon from "@material-ui/core/SvgIcon";
import CleanActiveTenants from "../../../actions/CleanActiveTenants";

export const ActiveTenantIconFilled = props => (
    <SvgIcon {...props}>
        <g>
            <rect fill="none" height="24" width="24"/>
        </g>
        <g>
            <g>
                <path
                    d="M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5 C22,3.9,21.1,3,20,3z M10,17H5v-2h5V17z M10,13H5v-2h5V13z M10,9H5V7h5V9z M14.82,15L12,12.16l1.41-1.41l1.41,1.42L17.99,9 l1.42,1.42L14.82,15z"
                    fillRule="evenodd"/>
            </g>
        </g>
    </SvgIcon>
);

export const ActiveTenantMenuIcon = props => (
    <SvgIcon {...props}>
        <g>
            <g>
                <path
                    d="M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5 C22,3.9,21.1,3,20,3z M20,19H4V5h16V19z"
                    fill-rule="evenodd"/>
                <polygon fill-rule="evenodd" points="19.41,10.42 17.99,9 14.82,12.17 13.41,10.75 12,12.16 14.82,15"/>
                <rect fill-rule="evenodd" height="2" width="5" x="5" y="7"/>
                <rect fill-rule="evenodd" height="2" width="5" x="5" y="11"/>
                <rect fill-rule="evenodd" height="2" width="5" x="5" y="15"/>
            </g>
        </g>
    </SvgIcon>
);

export default {
    title: 'Active Tenant',
    icon: <ActiveTenantIconFilled/>,
    actions: {
        index: {
            component: ActiveTenants
        }
    },
    onlyActions: [Index, CleanActiveTenants]
};
