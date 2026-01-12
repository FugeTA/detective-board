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
        .header("Content-Type", mime_type)
        .body(data.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else if res.status().as_u16() == 409 {
        // File already exists (conflict) - this is acceptable since we use content-based hashing
        // The same hash means the same content, so no need to re-upload
        Ok(())
    } else {
        Err(format!("Supabase error: {}", res.status()))
    }
}
