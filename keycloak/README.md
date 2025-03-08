# Keycloak (OIDC Identity Provider)

## Run (dev mode)

```sh
docker run -p 5000:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.0.5 start-dev
```

Then create a new realm with admin user by running python script:

```sh
python seed_dev.py
```

Store the public key (will be hardcoded in the contract).