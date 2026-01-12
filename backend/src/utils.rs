use rand::{distributions::Alphanumeric, Rng};
use sqlx::PgPool;

/// Generates a 6-character alphanumeric share code.
/// Provides approximately 2.2 billion possible combinations (36^6).
pub fn generate_share_code() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect::<String>()
        .to_uppercase()
}

/// Generates a unique share code with collision detection.
/// Retries up to 10 times if a collision occurs.
pub async fn generate_unique_share_code(db: &PgPool) -> Result<String, String> {
    const MAX_RETRIES: u32 = 10;
    
    for _ in 0..MAX_RETRIES {
        let code = generate_share_code();
        
        // Check if code already exists
        let exists = sqlx::query("SELECT 1 FROM shared_cases WHERE share_code = $1")
            .bind(&code)
            .fetch_optional(db)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        
        if exists.is_none() {
            return Ok(code);
        }
    }
    
    Err("Failed to generate unique share code after maximum retries".to_string())
}
