import subprocess

DEBUG_WITH_SIMPLE_IDENTITY = False

if not DEBUG_WITH_SIMPLE_IDENTITY:
    SIMPLE_IDENTITY_PATH = "./hyle"

    jwt = open("jwt_public_key.pem", "r").readlines()[1].strip()

    print("Initializing Hyle identity contract with JWT:", jwt)
    subprocess.run(
        f"RISC0_DEV_MODE=1 cargo run -- register-contract {jwt}",
        shell=True,
        cwd=SIMPLE_IDENTITY_PATH,
    )
else:
    SIMPLE_IDENTITY_PATH = "./examples/simple-identity"
    print("Initializing Hyle identity contract")
    subprocess.run(
        f"RISC0_DEV_MODE=1 cargo run -- register-contract",
        shell=True,
        cwd=SIMPLE_IDENTITY_PATH,
    )

SIMPLE_TOKEN_PATH = "./examples/simple-token"

print("Initializing Hyle token contract")
subprocess.run(
    f"RISC0_DEV_MODE=1 cargo run -- register 1000",
    shell=True,
    cwd=SIMPLE_TOKEN_PATH,
)
