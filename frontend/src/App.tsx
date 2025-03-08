import { useAuth } from "react-oidc-context";
import { Button } from "./components/ui/button";

function App() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        Hello {auth.user?.profile.name} ,
        <pre>{JSON.stringify(auth.user, null, 2)}</pre>
        <Button onClick={() => void auth.removeUser()}>Log out</Button>
      </div>
    );
  }

  return <Button onClick={() => void auth.signinRedirect()}>Log in</Button>;
}

export default App;

// TODO: make the following work (automatic sign in)

// import React from "react";
// import { useAuth, hasAuthParams } from "react-oidc-context";
// import { Button } from "@/components/ui/button";

// function App() {
//   // return (
//   //   <div className="flex flex-col items-center justify-center min-h-svh">
//   //     <Button>Click me</Button>
//   //   </div>
//   // )
//   const auth = useAuth();
//   const [hasTriedSignin, setHasTriedSignin] = React.useState(false);

//   // automatically sign-in
//   React.useEffect(() => {
//     if (
//       !hasAuthParams() &&
//       !auth.isAuthenticated &&
//       !auth.activeNavigator &&
//       !auth.isLoading &&
//       !hasTriedSignin
//     ) {
//       auth.signinRedirect();
//       setHasTriedSignin(true);
//     }
//   }, [auth, hasTriedSignin]);

//   if (auth.isLoading) {
//     return <div>Signing you in/out...</div>;
//   }

//   if (!auth.isAuthenticated) {
//     return <div>Unable to log in</div>;
//   }

//   return <Button onClick={() => void auth.removeUser()}>Log out</Button>;
// }

// export default App;
