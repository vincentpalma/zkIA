# Frontend

Created following https://ui.shadcn.com/docs/installation/vite.

## Add components

```sh
pnpm dlx shadcn@latest add button
```

And the component will be added to `src/components/ui/button.tsx`, and the source can be edited there. Go to https://ui.shadcn.com/docs/components/ for the full list of installable components.

## Auth

Managed using [react-oidc-context](https://github.com/authts/react-oidc-context/), a keycloak backend must be running (see config.ts).
