use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use borsh::{BorshDeserialize, BorshSerialize};
use jsonwebkey::JsonWebKey;
use serde::{Deserialize, Serialize};
use rsa::{
    pkcs8::DecodePublicKey,
    sha2::{Digest, Sha256},
    Pkcs1v15Sign, RsaPublicKey,
};

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Debug, Clone, Eq, PartialEq)]
pub struct JwkPublicKey {
    pub n: String,
    pub e: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct OpenIdContext {
    pub issuer: String,
    pub audience: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: u64,
    pub aud: String,
    pub iss: String,
}

fn split_jwt(token: &str) -> Result<(&str, &str, &str), String> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid JWT structure".to_string());
    }
    Ok((parts[0], parts[1], parts[2]))
}

fn decode_b64(input: &str) -> Result<Vec<u8>, String> {
    URL_SAFE_NO_PAD
        .decode(input)
        .map_err(|_| "Failed to decode Base64".to_string())
}

pub fn verify_jwt_signature(
    token: &str,
    jwk_pub_key: &JwkPublicKey,
    context: &OpenIdContext,
) -> Result<Claims, String> {
    let jwt_str = format!(
        "{{\"kty\":\"RSA\",\"e\":\"{}\",\"n\":\"{}\"}}",
        jwk_pub_key.e, jwk_pub_key.n
    );

    let jwk: JsonWebKey = jwt_str.parse().unwrap();

    let pub_key = RsaPublicKey::from_public_key_der(jwk.key.to_der().as_slice()).unwrap();

    let (header_b64, payload_b64, signature_b64) = split_jwt(token)?;

    let signing_input = format!("{}.{}", header_b64, payload_b64);

    let mut hasher = sha2::Sha256::new();
    hasher.update(signing_input);
    let hashed = &hasher.finalize();

    let signature = decode_b64(signature_b64)?;

    pub_key
        .verify(Pkcs1v15Sign::new::<Sha256>(), hashed, &signature)
        .map_err(|e| format!("JWT signature verification failed: {}", e))?;

    let payload_bytes = decode_b64(payload_b64)?;

    let claims: Claims = serde_json::from_slice(&payload_bytes)
        .map_err(|_| "Failed to parse JWT claims".to_string())?;

    if !claims.aud.contains(&context.audience) {
        return Err(format!(
            "Invalid Audience: expected `{}`, got `{:?}`",
            context.audience, claims.aud
        ));
    }
    if claims.iss != context.issuer {
        return Err(format!(
            "Invalid Issuer: expected `{}`, got `{}`",
            context.issuer, claims.iss
        ));
    }

    Ok(claims)
}
