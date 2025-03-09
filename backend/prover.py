import subprocess
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)  # allow CORS for all domains on all routes
app.config["CORS_HEADERS"] = "Content-Type"

SIMPLE_IDENTITY_PATH = (
    "/home/vince/Documents/crypto/hackathon_bsa/examples/simple-identity"
)

HYDENTITY_HOST_PATH = (
    "/home/vince/Documents/crypto/hyle/crates/contracts/hydentity/examples"
)


@app.route("/registerIdentity", methods=["POST"])
def register_identity():
    host = request.json["host"] if "host" in request.json else "http://localhost:4321"
    contract_name = (
        request.json["contract_name"]
        if "contract_name" in request.json
        else "simple_identity"
    )
    identity = request.json["identity"]
    password = request.json["password"]

    # return subprocess.run(
    #     f"RISC0_DEV_MODE=1 cargo run -- --host {host} --contract-name {contract_name} register-identity {identity} {password}",
    #     shell=True,
    #     cwd=SIMPLE_IDENTITY_PATH,
    # ).stdout

    result = subprocess.check_output(
        f"RISC0_DEV_MODE=1 cargo run -- register-identity {identity} {password}",
        shell=True,
        cwd=SIMPLE_IDENTITY_PATH,
    )

    print("result", result)
    return result


@app.route("/verifyIdentity", methods=["POST"])
def verify_identity():
    identity = request.json["identity"]
    password = request.json["password"]
    nonce = request.json["nonce"] if "nonce" in request.json else 0

    result = subprocess.check_output(
        f"RISC0_DEV_MODE=1 cargo run -- verify-identity {identity} {password} {nonce}",
        shell=True,
        cwd=SIMPLE_IDENTITY_PATH,
    )

    print("result", result)
    return result


app.run(host="0.0.0.0", port=4000)
