//https://github.com/authts/sample-keycloak-react-oidc-context/blob/main/react/src/config.ts

import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

export const userManager = new UserManager({
  authority: "http://localhost:5000/realms/hyle",
  client_id: "webapp",
  // authority: process.env.KEYCLOACK_AUTHORITY, // TODO: use env vars
  // client_id: process.env.KEYCLOACK_CLIENT_ID,
  redirect_uri: `${window.location.origin}${window.location.pathname}`,
  post_logout_redirect_uri: window.location.origin,
  // userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // monitorSession: true, // this allows cross tab login/logout detection
})