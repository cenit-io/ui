import React from 'react';
import Oauth2Authorization from "./Oauth2Authorization";
import AuthorizationFilledIcon from "../../../icons/AuthorizationFilledIcon";
import deepDup from "../../../common/deepDup";

const AppAuthorization = {
  ...deepDup(Oauth2Authorization),
  title: 'App Authorization',
  icon: <AuthorizationFilledIcon />
};

AppAuthorization.fields.client.selector = {
  origin: 'app'
};

export default AppAuthorization;
