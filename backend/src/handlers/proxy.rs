use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use reqwest::Client;
use std::sync::Arc;
use crate::models::{ProxyParams, AppState};

pub async fn proxy_pdf_handler(Query(params): Query<ProxyParams>) -> impl IntoResponse {
    let client = Client::new();

    match client.get(&params.url).send().await {
        Ok(resp) => {
            if !resp.status().is_success() {
                return (StatusCode::BAD_REQUEST, "Failed to fetch PDF").into_response();
            }

            let bytes = match resp.bytes().await {
                Ok(b) => b,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read bytes").into_response(),
            };

            Response::builder()
                .header("Content-Type", "application/pdf")
                .body(axum::body::Body::from(bytes))
                .unwrap()
                .into_response()
        }
        Err(_) => (StatusCode::BAD_REQUEST, "Invalid URL").into_response(),
    }
}

/// 任意のメディアをプロキシするハンドラ（画像/音声/動画など）
pub async fn proxy_media_handler(Query(params): Query<ProxyParams>) -> impl IntoResponse {
    let client = Client::new();

    match client.get(&params.url).send().await {
        Ok(resp) => {
            let status = resp.status();
            let content_type = resp
                .headers()
                .get("Content-Type")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("application/octet-stream")
                .to_string();

            let bytes = match resp.bytes().await {
                Ok(b) => b,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read bytes").into_response(),
            };

            Response::builder()
                .status(status)
                .header("Content-Type", content_type)
                .body(axum::body::Body::from(bytes))
                .unwrap()
                .into_response()
        }
        Err(_) => (StatusCode::BAD_REQUEST, "Invalid URL").into_response(),
    }
}

/// Supabase Storageのアセットをプロキシするハンドラ
pub async fn proxy_storage_asset_handler(
    State(state): State<Arc<AppState>>,
    Path(path): Path<String>,
) -> impl IntoResponse {
    // authenticatedエンドポイントを使用して、service_roleキーで取得する
    let url = format!("{}/storage/v1/object/authenticated/case-assets/{}", 
        state.supabase_url.trim_end_matches('/'), 
        path
    );

    match state.client.get(&url)
        .header("Authorization", format!("Bearer {}", state.supabase_key))
        .header("apikey", &state.supabase_key)
        .send().await {
        Ok(resp) => {
            let status = resp.status();
            let content_type = resp.headers().get("Content-Type")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("application/octet-stream").to_string();
            let bytes = resp.bytes().await.unwrap_or_default();

            Response::builder()
                .status(status)
                .header("Content-Type", content_type)
                .body(axum::body::Body::from(bytes))
                .unwrap()
                .into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Proxy error").into_response(),
    }
}
