use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
};
use axum_extra::extract::Multipart;
use serde_json::{json, Value};
use std::sync::Arc;
use sha2::{Sha256, Digest};
use sqlx::Row;
use chrono::{Utc, Duration};
use uuid::Uuid;

use crate::models::AppState;
use crate::supabase::upload_to_supabase;
use crate::utils::generate_share_code;

pub async fn share_case_handler(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut case_data: Option<Value> = None;
    let mut asset_ids: Vec<Uuid> = Vec::new();

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();

        if name == "case_data" {
            if let Ok(data) = field.text().await {
                if let Ok(json) = serde_json::from_str::<Value>(&data) {
                    case_data = Some(json);
                }
            }
        } else if name == "files[]" {
            if let Ok(bytes) = field.bytes().await {
                let kind = match infer::get(&bytes) {
                    Some(k) => k,
                    None => continue,
                };

                let mime = kind.mime_type();
                let is_valid = mime == "application/pdf" || mime.starts_with("image/");

                if !is_valid {
                    println!("Skipping invalid file type: {}", mime);
                    continue;
                }

                let mut hasher = Sha256::new();
                hasher.update(&bytes);
                let hash = hex::encode(hasher.finalize());
                
                // Check if asset already exists
                let existing_asset = sqlx::query("SELECT id FROM assets WHERE file_hash = $1")
                    .bind(&hash)
                    .fetch_optional(&state.db)
                    .await;

                match existing_asset {
                    Ok(Some(row)) => {
                        // Asset exists, update last_accessed_at and reuse ID
                        let id: Uuid = row.get("id");
                        let _ = sqlx::query("UPDATE assets SET last_accessed_at = NOW() WHERE id = $1")
                            .bind(id)
                            .execute(&state.db)
                            .await;
                        asset_ids.push(id);
                    },
                    Ok(None) => {
                        // Asset does not exist, upload to Supabase
                        let storage_path = format!("{}/{}/{}", &hash[0..2], &hash[2..4], hash);
                        let upload_result = upload_to_supabase(
                            &state, 
                            "case-assets",
                            &storage_path, 
                            bytes.to_vec(), 
                            &mime
                        ).await;

                        match upload_result {
                            Ok(_) => {                        
                                let row = sqlx::query(
                                    r#"
                                    INSERT INTO assets (file_hash, storage_path, mime_type, size_bytes)
                                    VALUES ($1, $2, $3, $4)
                                    RETURNING id
                                    "#
                                )
                                .bind(&hash)
                                .bind(&storage_path)
                                .bind(&mime)
                                .bind(bytes.len() as i64)
                                .fetch_one(&state.db)
                                .await;

                                match row {
                                    Ok(r) => {
                                        let id: Uuid = r.get("id");
                                        asset_ids.push(id);
                                    },
                                    Err(e) => {
                                        eprintln!("DB Error (assets insert): {:?}", e);
                                        return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response();
                                    }
                                }
                            },
                            Err(e) => {
                                eprintln!("Failed to upload {}: {}", hash, e);
                                return (StatusCode::INTERNAL_SERVER_ERROR, "Storage upload failed").into_response();
                            }
                        }
                    },
                    Err(e) => {
                        eprintln!("DB Error (assets check): {:?}", e);
                        return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response();
                    }
                }
            }
        }
    }

    if let Some(data) = case_data {
        let share_code = generate_share_code();
        let expires_at = Utc::now() + Duration::days(7);

        let case_row = sqlx::query(
            "INSERT INTO shared_cases (share_code, data, expires_at) VALUES ($1, $2, $3) RETURNING id"
        )
        .bind(&share_code)
        .bind(&data)
        .bind(expires_at)
        .fetch_one(&state.db)
        .await;

        match case_row {
            Ok(r) => {
                let case_id: Uuid = r.get("id");

                for asset_id in asset_ids {
                    let _ = sqlx::query(
                        "INSERT INTO case_assets (case_id, asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
                    )
                    .bind(case_id)
                    .bind(asset_id)
                    .execute(&state.db)
                    .await;
                }

                return Json(json!({
                    "status": "success",
                    "share_code": share_code,
                    "expires_at": expires_at.to_rfc3339()
                })).into_response();
            },
            Err(e) => {
                eprintln!("DB Error (shared_cases): {:?}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to save case").into_response();
            }
        }
    }

    (StatusCode::BAD_REQUEST, "Missing case_data").into_response()
}
