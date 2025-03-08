# Keycloak (OIDC Identity Provider)

## Run (dev mode)

```sh
docker run -p 5000:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.0.5 start-dev
```

(Optional) Add Google provider. Follow https://medium.com/@stefannovak96/signing-in-with-google-with-keycloak-bf5166e93d1e and add the client id and secret to `.env`.

Then reate a new realm by running python script:

```sh
python seed_dev.py
```

Store the public key (will be hardcoded in the contract, needs to be updated each time a new realm is used).