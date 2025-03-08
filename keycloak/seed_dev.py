# creates a new realm and client in keycloak (dev mode)
# reference: https://www.stefaanlippens.net/keycloak-programmatically-create-clients-and-users.html

import requests

keycloak_root = "http://localhost:5000"
keycloak_admin = "admin"
keycloak_admin_password = "admin"
# names of the realm and client to create
realm = "hyle"
client_id = "webapp"

resp = requests.post(
    f"{keycloak_root}/realms/master/protocol/openid-connect/token",
    data={
        "client_id": "admin-cli",
        "username": keycloak_admin,
        "password": keycloak_admin_password,
        "grant_type": "password",
    },
)

resp.raise_for_status()
data = resp.json()
access_token = data["access_token"]
print(f"{access_token[:20]}...{access_token[-20:]}")
print(f"Expires in {data['expires_in']}s")

# Predefine authorization headers for later use.
auth_headers = {
    "Authorization": f"Bearer {access_token}",
}

resp = requests.get(
    f"{keycloak_root}/admin/realms",
    headers=auth_headers,
)
resp.raise_for_status()

# Create realm
resp = requests.post(
    f"{keycloak_root}/admin/realms",
    headers=auth_headers,
    json={"realm": realm, "enabled": True},
)
resp.raise_for_status()

client_settings = {
    "protocol": "openid-connect",
    "clientId": client_id,
    "name": "",
    "description": "",
    "publicClient": True,
    "authorizationServicesEnabled": False,
    "serviceAccountsEnabled": False,
    "implicitFlowEnabled": False,
    "directAccessGrantsEnabled": True,
    "standardFlowEnabled": True,
    "frontchannelLogout": True,
    "attributes": {
        "saml_idp_initiated_sso_url_name": "",
        "oauth2.device.authorization.grant.enabled": False,
        "oidc.ciba.grant.enabled": False,
        "post.logout.redirect.uris": "http://localhost:3000/*",
    },
    "alwaysDisplayInConsole": False,
    "rootUrl": "",
    "baseUrl": "",
    "redirectUris": ["http://localhost:3000/*"],
    "webOrigins": ["http://localhost:3000"],
}

resp = requests.post(
    f"{keycloak_root}/admin/realms/{realm}/clients",
    json=client_settings,
    headers=auth_headers,
)
resp.raise_for_status()
location = resp.headers["Location"]
print(location)

settings = requests.get(
    location,
    headers=auth_headers,
).json()

assert settings["clientId"] == client_id and settings["enabled"]
print("Realm and public client created successfully.")

# Create a user
username = "test"
password = "test"
email = "test@example.com"
first_name = "test"
last_name = "test"

user_settings = {
    "attributes": {"locale": ""},
    "requiredActions": [],
    "emailVerified": True,
    "username": username,
    "email": email,
    "firstName": first_name,
    "lastName": last_name,
    "groups": [],
    "enabled": True,
    "credentials": [
        {
            "type": "password",
            "value": password,
            "temporary": False,
        }
    ],
}

resp = requests.post(
    f"{keycloak_root}/admin/realms/{realm}/users",
    json=user_settings,
    headers=auth_headers,
)
resp.raise_for_status()
location = resp.headers["Location"]
print(location)

user_settings = requests.get(
    location,
    headers=auth_headers,
).json()

assert user_settings["username"] == username and user_settings["enabled"]
print(f"User {username} with password {password} created successfully.")
print("User settings:", user_settings)

resp = requests.get(
    f"{keycloak_root}/realms/{realm}",
    json=user_settings,
    headers=auth_headers,
)
resp.raise_for_status()

print("Public key:")
print(
    "-----BEGIN PUBLIC KEY-----\n"
    + resp.json()["public_key"]
    + "\n-----END PUBLIC KEY-----"
)

# with open("jwt_public_key.pem", "w") as f:
#     f.write(
#         "-----BEGIN PUBLIC KEY-----\n"
#         + resp.json()["public_key"]
#         + "\n-----END PUBLIC KEY-----"
#     )
