use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use reqwest::Client;
use crate::models::ProxyParams;

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
