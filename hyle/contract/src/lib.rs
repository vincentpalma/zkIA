use borsh::{io::Error, BorshDeserialize, BorshSerialize};
use jwt::{JwkPublicKey, OpenIdContext};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, env::args};
use sdk::{identity_provider::{IdentityVerification}, caller::ExecutionContext, Digestable, HyleContract, RunResult};
use sha2::{Digest, Sha256};
extern crate alloc;
use alloc::vec;

pub mod jwt;


impl HyleContract for IdentityContractState {
    /// Entry point of the contract's logic
    fn execute(&mut self, contract_input: &sdk::ContractInput) -> RunResult {
        // Parse contract inputs
        let (action, ctx) = sdk::utils::parse_raw_contract_input::<
            IdentityAction,
        >(contract_input)?;

        // Extract private information
        let password = core::str::from_utf8(&contract_input.private_input).unwrap();

        // Execute the given action
        self.execute_action(ctx, action, password)
    }
}

/// Struct to hold account's information
#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct AccountInfo {
    pub hash: String,
    pub nonce: u32,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct AuthorizedIdentification {
    pub emailAccountInfo: Option<AccountInfo>,
    pub passwordAccountInfo: Option<AccountInfo>
}


#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone, Eq, PartialEq)]
pub enum IdentificationMethods {
    Email,
    Password,
}

/// The state of the contract, that is totally serialized on-chain
#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone)]
pub struct IdentityContractState {
    identities: BTreeMap<String, AuthorizedIdentification>,
    jwkPublicKey: JwkPublicKey,
}

// Enum representing the actions that can be performed by the IdentityVerification contract.
#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone, Eq, PartialEq)]
pub enum IdentityAction {
    RegisterIdentity {
        identification_method: IdentificationMethods,
        account: String,
        context: OpenIdContext,
    },
    VerifyIdentity {
        identification_method: IdentificationMethods,
        account: String,
        nonce: u32,
        context: OpenIdContext,
    },
    GetIdentityInfo {
        account: String,
    },
}


// Types of Account Registration
//TODO: make identificationMethod a execute action param.
/// Some helper methods for the state
impl IdentityContractState {

    pub fn execute_action(
        &mut self,
        context: ExecutionContext,
        action: IdentityAction,
        private_input: &str,
    ) -> RunResult {
        let program_output = match action {
            IdentityAction::RegisterIdentity {
                account,
                context,
                identification_method,
            } => match self.register_identity(&account,private_input,Some(&context), identification_method ) {
                Ok(()) => Ok(format!(
                    "Successfully registered identity for account: {}",
                    account
                )),
                Err(err) => Err(format!("Failed to register identity: {}", err)),
            },
            IdentityAction::VerifyIdentity {
                identification_method,
                account,
                nonce,
                context,
            } => match self.verify_identity(&account, nonce,  private_input, Some(&context), identification_method ) {
                Ok(true) => Ok(format!("Identity verified for account: {}", account)),
                Ok(false) => Err(format!(
                    "Identity verification failed for account: {}",
                    account
                )),
                Err(err) => Err(format!("Error verifying identity: {}", err)),
            },
            IdentityAction::GetIdentityInfo { account } => match self.get_identity_info(&account) {
                Ok(info) => Ok(format!(
                    "Retrieved identity info for account: {}: {}",
                    account, info
                )),
                Err(err) => Err(format!("Failed to get identity info: {}", err)),
            },
        };
        program_output.map(|output: String| (output, context, alloc::vec![]))
    }


    pub fn new(jwkPublicKey:JwkPublicKey) -> Self {
        IdentityContractState {
            identities: BTreeMap::new(),
            jwkPublicKey,
        }
    }

    pub fn get_nonce(&self, username: &str) -> Result<u32, &'static str> {
        let info = self.identities.get(username).ok_or("Identity not found")?;
        match info.emailAccountInfo {
            Some(ref email_info) => Ok(email_info.nonce),
            None => Err("No email account info found"),
        }
    }

    pub fn as_bytes(&self) -> Result<Vec<u8>, Error> {
        borsh::to_vec(self)
    }
}

// The IdentityVerification trait is implemented for the IdentityContractState struct
// This trait is given by the sdk, as a "standard" for identity verification contracts
// but you could do the same logic without it.
impl IdentityContractState {
    fn register_identity(
        &mut self,
        account: &str,
        private_input: &str,
        context: Option<&OpenIdContext>,
        identification_method: IdentificationMethods,
    ) -> Result<(), &'static str> {
        match identification_method {
            IdentificationMethods::Email => {
                let data =
                    jwt::verify_jwt_signature(private_input, &self.jwkPublicKey, context.unwrap())
                        .expect("Failed to verify JWT");
                let sub = data.sub;
                let issuer = data.iss;

                let id = format!("{sub}:{issuer}");
                let mut hasher = Sha256::new();
                hasher.update(id.as_bytes());
                let hash_bytes = hasher.finalize();
                let account_info = AccountInfo {
                    hash: hex::encode(hash_bytes),
                    nonce: 0,
                };
                let auth_id = AuthorizedIdentification {
                    emailAccountInfo: Some(account_info),
                    passwordAccountInfo: None
                };
                if self
                    .identities
                    .insert(account.to_string(), auth_id)
                    .is_some()
                {
                    return Err("Identity already exists");
                }
                return Ok(())
            }

            IdentificationMethods::Password => {
                let email_account_info = {
                    let identity = &self.identities.get(account).unwrap();
                    match &identity.emailAccountInfo {
                        Some(info) => info.clone(),
                        None => return Err("Can't register pswd before email, you must register email first"),
                    }
                };
                // splitting between password to set and jwt
                // by convention we have that the first part will be the password
                let parts: Vec<&str> = private_input.split(' ').collect();
                let priv_pswd = parts[0];
                let priv_jwt = parts[1];

                let email_account_info_nonce = self.get_nonce(account);


                let email_account_info_clone = email_account_info.clone();
                let email_account_info_nonce = email_account_info_clone.nonce;
                self.verify_identity(account, email_account_info_nonce, priv_jwt, context, IdentificationMethods::Email);
                let id = format!("{account}:{private_input}");
                let mut hasher = Sha256::new();
                hasher.update(id.as_bytes());
                let hash_bytes = hasher.finalize();
                let password_account_info = AccountInfo {
                    hash: hex::encode(hash_bytes),
                    nonce: 0,
                };
                let auth_id = AuthorizedIdentification {
                    emailAccountInfo: Some(email_account_info.clone()),
                    passwordAccountInfo: Some(password_account_info)
                };
                if self
                    .identities
                    .insert(account.to_string(), auth_id)
                    .is_some()
                {
                    return Err("Identity already exists");
                }
                return Ok(());
            }
        }
    }

    fn verify_identity(
        &mut self,
        account: &str,
        nonce: u32,
        private_input: &str,
        context: Option<&OpenIdContext>,
        identification_method: IdentificationMethods,
    ) -> Result<bool, &'static str> {

        match identification_method {
            IdentificationMethods::Email => {

                match self.identities.get_mut(account).unwrap().emailAccountInfo.as_mut() {
                    Some(stored_info) => {
                        if nonce != stored_info.nonce {
                            return Err("Invalid nonce");
                        }
        
                        let data = jwt::verify_jwt_signature(private_input, &self.jwkPublicKey, context.unwrap())
                            .expect("Failed to verify ID token JWT");
        
                        let sub = data.sub;
                        let issuer = data.iss;
        
                        let id = format!("{sub}:{issuer}");
        
                        let mut hasher = Sha256::new();
                        hasher.update(id.as_bytes());
                        let hashed = hex::encode(hasher.finalize());
                        if *stored_info.hash != hashed {
                            return Ok(false);
                        }
                        stored_info.nonce += 1;
                        Ok(true)
                    }
                    None => Err("Identity not found"),
                }

            },

            IdentificationMethods::Password => {
                match self.identities.get_mut(account).unwrap().passwordAccountInfo.as_mut() {
                    Some(stored_info) => {
                        if nonce != stored_info.nonce {
                            return Err("Invalid nonce");
                        }
                        let id = format!("{account}:{private_input}");
                        let mut hasher = Sha256::new();
                        hasher.update(id.as_bytes());
                        let hashed = hex::encode(hasher.finalize());
                        if *stored_info.hash != hashed {
                            return Ok(false);
                        }
                        stored_info.nonce += 1;
                        Ok(true)
                    }
                    None => Err("Identity not found"),
                }
            }
        }

      
    }

    fn get_identity_info(&self, account: &str) -> Result<String, &'static str> {
        match self.identities.get(account) {
            Some(info) => Ok(serde_json::to_string(&info).map_err(|_| "Failed to serialize")?),
            None => Err("Identity not found"),
        }
    }
}

impl Default for IdentityContractState {
    fn default() -> Self {
        Self::new(JwkPublicKey {e:"asdf".to_string() , n: "asdf".to_string()})
    }
}

/// Helpers to transform the contrat's state in its on-chain state digest version.
/// In an optimal version, you would here only returns a hash of the state,
/// while storing the full-state off-chain
impl Digestable for IdentityContractState {
    fn as_digest(&self) -> sdk::StateDigest {
        sdk::StateDigest(borsh::to_vec(&self).expect("Failed to encode Balances"))
    }
}

impl From<sdk::StateDigest> for IdentityContractState {
    fn from(state: sdk::StateDigest) -> Self {
        borsh::from_slice(&state.0)
            .map_err(|_| "Could not decode identity state".to_string())
            .unwrap()
    }
}
