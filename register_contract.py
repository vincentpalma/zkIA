import subprocess

DEBUG_WITH_SIMPLE_IDENTITY = True
if not DEBUG_WITH_SIMPLE_IDENTITY:
    SIMPLE_IDENTITY_PATH = "/home/vince/Documents/crypto/hackathon_bsa/zkIA/hyle"
else:
    SIMPLE_IDENTITY_PATH = (
        "/home/vince/Documents/crypto/hackathon_bsa/examples/simple-identity"
    )

SIMPLE_TOKEN_PATH = "/home/vince/Documents/crypto/hackathon_bsa/examples/simple-token"

jwt = open("jwt_public_key.pem", "r").readlines()[1].strip()

print("Initializing Hyle identity contract with JWT:", jwt)
subprocess.run(
    f"RISC0_DEV_MODE=1 cargo run -- register-contract {jwt}",
    shell=True,
    cwd=SIMPLE_IDENTITY_PATH,
)

print("Initializing Hyle token contract")
subprocess.run(
    f"RISC0_DEV_MODE=1 cargo run -- register 1000",
    shell=True,
    cwd=SIMPLE_TOKEN_PATH,
)
