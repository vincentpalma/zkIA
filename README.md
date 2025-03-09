# zkIA (name subject to change)

## Quickstart

1. Run the Hyle local node on `localhost:4321`.

2. Run the Keycloak backend on `localhost:5000`: `./keycloak/run_dev.sh`.

3. Create a Keycloak realm and seed it with a test user: `python ./keycloak/seed_dev.py`. This will generate the JWT public key that will be hardcoded in the Hyle contract.

4. Run the prover rest API on `localhost:4000`: `python ./prover/prover.py` (run `pip install -r ./prover/requirements.txt`). Additionally, this will automatically register the Hyle contract on the local node.

5. Run the frontend on `localhost:3000`: `cd frontend && pnpm run dev`. (run `pnpm install` first if not already done).

## References

- [simple-identity example contract](https://github.com/Hyle-org/examples/blob/main/simple-identity)
- [reference oidc contract](https://github.com/Hyle-org/hackathons/tree/main/oidc-identity)
