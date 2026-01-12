mod handlers;
mod models;
mod supabase;
mod utils;

use axum::{
    extract::DefaultBodyLimit,
    http::{HeaderValue, Method},
    routing::{get, post},
    Router,
};
use reqwest::Client;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;

use crate::models::AppState;
use crate::handlers::{
    proxy::proxy_pdf_handler,
    proxy::proxy_storage_asset_handler,
    share::share_case_handler,
    import::import_case_handler,
};

#[tokio::main]
async fn main() {
    if let Err(e) = dotenv() {
        println!("Note: .env file not loaded: {}", e);
    }

    let supabase_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL must be set");
    let supabase_key = std::env::var("SUPABASE_KEY").expect("SUPABASE_KEY must be set");
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set").trim().to_string();
    let backend_url = std::env::var("BACKEND_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());

    // 接続先ホストをログ出力（デバッグ用）
    if let Some(host) = database_url.split('@').nth(1).and_then(|s| s.split('/').next()) {
        println!("Attempting to connect to DB host: {}", host);
    }

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to DB");

    let state = Arc::new(AppState {
        supabase_url,
        supabase_key,
        client: Client::new(),
        db: pool,
        backend_url,
    });

    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3000".parse::<HeaderValue>().unwrap(),
            "https://detective-board-jet.vercel.app".parse::<HeaderValue>().unwrap(),
        ])
        .allow_methods([Method::GET, Method::POST]);

    let app = Router::new()
        .route("/api/proxy-pdf", get(proxy_pdf_handler))
        .route("/api/storage/{*path}", get(proxy_storage_asset_handler))
        .route("/api/share", post(share_case_handler))
        .route("/api/import/{code}", get(import_case_handler))
        .layer(DefaultBodyLimit::max(50 * 1024 * 1024))
        .layer(cors)
        .with_state(state);

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .expect("PORT must be a number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
