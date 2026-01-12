use crate::models::AppState;

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
        .header("apikey", &state.supabase_key)
        .header("x-upsert", "true") // 同一ハッシュのファイルが存在する場合に上書き（エラー回避）を許可
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
