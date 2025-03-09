import subprocess
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)  # allow CORS for all domains on all routes
app.config["CORS_HEADERS"] = "Content-Type"

DEBUG_WITH_SIMPLE_IDENTITY = False
if not DEBUG_WITH_SIMPLE_IDENTITY:
    SIMPLE_IDENTITY_PATH = "./hyle"
else:
    SIMPLE_IDENTITY_PATH = "./examples/simple-identity"

SIMPLE_TOKEN_PATH = "./examples/simple-token"


@app.route("/register", methods=["POST"])
def register_identity():
    identity = request.json["identity"]
    password = request.json["password"]
    method = request.json["method"] if "method" in request.json else "email"

    method = "email" if method == "register" else "password"

    if DEBUG_WITH_SIMPLE_IDENTITY:
        method = ""

    print("ASDASDASD")
    print(
        f"RISC0_DEV_MODE=1 cargo run -- register-identity {identity} {password} {method}"
    )

    result = subprocess.check_output(
        f"RISC0_DEV_MODE=1 cargo run -- register-identity {identity} {password} {method}",
        shell=True,
        cwd=SIMPLE_IDENTITY_PATH,
    )

    print("result", result)
    return result


@app.route("/verify", methods=["POST"])
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


@app.route("/transfer", methods=["POST"])
def transfer():
    sender_identity = "faucet.simple_token"  # TODO: get alice signature as parameter
    transfer_amount = request.json["transferAmount"]
    transfer_recipient = request.json["transferRecipient"]

    result = subprocess.check_output(
        f"RISC0_DEV_MODE=1 cargo run -- transfer {sender_identity} {transfer_recipient}.simple_identity {transfer_amount}",
        shell=True,
        cwd=SIMPLE_TOKEN_PATH,
    )

    print("result", result)
    return result


app.run(host="0.0.0.0", port=4000)
