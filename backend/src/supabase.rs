use crate::models::AppState;
use serde_json::{json, Value};

pub async fn upload_to_supabase(
    state: &AppState,
    bucket: &str,
    path: &str,
    data: Vec<u8>,
    mime_type: &str,
) -> Result<(), String> {
    let url = format!("{}/storage/v1/object/{}/{}", state.supabase_url, bucket, path);

    let res = state.client.post(&url)
        .header("Authorization", format!("Bearer {}", state.supabase_key))
        .header("Content-Type", mime_type)
        .body(data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Supabase error: {}", res.status()))
    }
}

pub async fn generate_signed_url(state: &AppState, bucket: &str, path: &str) -> Result<String, String> {
    let url = format!("{}/storage/v1/object/sign/{}/{}", state.supabase_url, bucket, path);
    let body = json!({ "expiresIn": 3600 }); // 1時間有効

    let res = state.client.post(&url)
        .header("Authorization", format!("Bearer {}", state.supabase_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let json: Value = res.json().await.map_err(|e| e.to_string())?;
        let signed_path = json["signedURL"].as_str().ok_or("No signedURL in response")?;
        
        // ★修正: ベースURLとパスの結合時にスラッシュが重複しないように安全に結合
        let base = state.supabase_url.trim_end_matches('/');
        let path = signed_path.trim_start_matches('/');
        Ok(format!("{}/{}", base, path))
    } else {
        Err(format!("Supabase sign error: {}", res.status()))
    }
}
