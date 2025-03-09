import subprocess

# SIMPLE_IDENTITY_PATH = (
#     "/home/vince/Documents/crypto/hackathon_bsa/examples/simple-identity"
# )

SIMPLE_IDENTITY_PATH = "/home/vince/Documents/crypto/hackathon_bsa/zkIA/hyle"

SIMPLE_TOKEN_PATH = "/home/vince/Documents/crypto/hackathon_bsa/examples/simple-token"

jwt = open("jwt_public_key.pem", "r").readlines()[1]

print("Initializing Hyle identity contract")
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
