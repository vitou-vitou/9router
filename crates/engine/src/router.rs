use crate::types::{BoundaryFault, ProviderKind, ResolvedRoute};

pub fn resolve(model: &str) -> Result<ResolvedRoute, BoundaryFault> {
    match model {
        "gpt-4o" | "gpt-4o-mini" => Ok(ResolvedRoute {
            provider: ProviderKind::OpenAI,
            upstream_model: model.to_string(),
            target_endpoint: "https://api.openai.com/v1/chat/completions".to_string(),
        }),
        "claude-3-5-sonnet" | "claude-3-7-sonnet" => Ok(ResolvedRoute {
            provider: ProviderKind::Claude,
            upstream_model: model.to_string(),
            target_endpoint: "https://api.anthropic.com/v1/messages".to_string(),
        }),
        "gemini-2.0-flash" | "gemini-1.5-pro" => Ok(ResolvedRoute {
            provider: ProviderKind::Gemini,
            upstream_model: model.to_string(),
            target_endpoint: "https://generativelanguage.googleapis.com/v1beta".to_string(),
        }),
        _ => Err(BoundaryFault::UnknownModel),
    }
}
