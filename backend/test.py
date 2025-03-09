import requests

print(
    requests.post(
        "http://localhost:4000/registerIdentity",
        json={"identity": "aliceeeee.simple_identity", "password": "abc123"},
    ).text
)
