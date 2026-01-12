use reqwest::Client;
use sqlx::{Pool, Postgres};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub struct AppState {
    pub supabase_url: String,
    pub supabase_key: String,
    pub client: Client,
    pub db: Pool<Postgres>,
    pub backend_url: String,
}

#[derive(Deserialize)]
pub struct ProxyParams {
    pub url: String,
}

#[derive(Serialize)]
pub struct ImportResponse {
    pub case_data: Value,
    pub assets: Vec<AssetResponse>,
}

#[derive(Serialize)]
pub struct AssetResponse {
    pub hash: String,
    pub url: String,
    pub mime: String,
}
