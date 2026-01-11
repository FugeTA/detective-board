use axum::{
    extract::Query,
    http::{HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use reqwest::Client;
use serde::Deserialize;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

// クエリパラメータの受け皿（?url=... の部分）
#[derive(Deserialize)]
struct ProxyParams {
    url: String,
}

#[tokio::main]
async fn main() {
    // 1. CORS設定（React:3000 からのアクセスを許可）
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET]);

    // 2. ルーティング設定
    let app = Router::new()
        .route("/api/proxy-pdf", get(proxy_pdf_handler))
        .layer(cors);

    // 3. サーバー起動（ポート8000）
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("listening on {}", addr);
    
    // Axum 0.7系の場合は serve を使用
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// ハンドラ関数：PDFを取りに行って返す
async fn proxy_pdf_handler(Query(params): Query<ProxyParams>) -> impl IntoResponse {
    let client = Client::new();

    // Pythonの requests.get(url) に相当
    match client.get(&params.url).send().await {
        Ok(resp) => {
            if !resp.status().is_success() {
                return (StatusCode::BAD_REQUEST, "Failed to fetch PDF").into_response();
            }

            // PDFの生データを取得
            let bytes = match resp.bytes().await {
                Ok(b) => b,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read bytes").into_response(),
            };

            // レスポンスを作成 (Content-Type: application/pdf を付与)
            Response::builder()
                .header("Content-Type", "application/pdf")
                .body(axum::body::Body::from(bytes))
                .unwrap()
                .into_response()
        }
        Err(_) => (StatusCode::BAD_REQUEST, "Invalid URL").into_response(),
    }
}