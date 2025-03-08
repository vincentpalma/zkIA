import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { AuthProvider } from "react-oidc-context";
import { onSigninCallback, userManager } from "./config.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <App />
    </AuthProvider>
  </StrictMode>
);
