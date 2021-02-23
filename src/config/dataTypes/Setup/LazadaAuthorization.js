import React from 'react';
import Oauth2Authorization from "./Oauth2Authorization";
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import deepDup from "../../../common/deepDup";

const LazadaAuthorization = {
    ...deepDup(Oauth2Authorization),
    title: 'Lazada Authorization',
    icon: <AuthorizationFilledIcon/>
};

export default LazadaAuthorization;
