use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use std::sync::Arc;
use chrono::Utc;
use uuid::Uuid;
use serde_json::Value;
use sqlx::Row;

use crate::models::{AppState, ImportResponse, AssetResponse};

pub async fn import_case_handler(
    Path(code): Path<String>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let case_row = sqlx::query("SELECT id, data, expires_at FROM shared_cases WHERE share_code = $1")
        .bind(&code)
        .fetch_optional(&state.db)
        .await;

    let case = match case_row {
        Ok(Some(row)) => row,
        Ok(None) => return (StatusCode::NOT_FOUND, "Case not found").into_response(),
        Err(e) => {
            eprintln!("DB Error: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response();
        }
    };

    let expires_at: chrono::DateTime<Utc> = case.get("expires_at");
    if expires_at < Utc::now() {
        return (StatusCode::GONE, "Case expired").into_response();
    }

    let case_id: Uuid = case.get("id");
    let case_data: Value = case.get("data");

    let assets_rows = sqlx::query(
        r#"
        SELECT a.file_hash, a.storage_path, a.mime_type
        FROM assets a
        JOIN case_assets ca ON a.id = ca.asset_id
        WHERE ca.case_id = $1
        "#
    )
    .bind(case_id)
    .fetch_all(&state.db)
    .await;

    let mut asset_responses = Vec::new();

    if let Ok(rows) = assets_rows {
        for row in rows {
            let storage_path: String = row.get("storage_path");
            
            // ★修正: 直接URLではなく、RustのプロキシURLを返す
            // フロントエンドがアクセスしやすいよう、相対パスまたは環境変数から構築
            let proxy_url = format!("/api/storage/{}", storage_path);
            
            asset_responses.push(AssetResponse {
                hash: row.get("file_hash"),
                url: proxy_url,
                mime: row.get("mime_type"),
            });
        }
    }

    Json(ImportResponse {
        case_data,
        assets: asset_responses,
    }).into_response()
}
