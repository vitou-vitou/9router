use serde::{Deserialize, Serialize};

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderKind {
    OpenAI = 0,
    Claude = 1,
    Gemini = 2,
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StreamState {
    Idle = 0,
    Connecting = 1,
    Streaming = 2,
    Completed = 3,
    Failed = 4,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngressEnvelope {
    pub model: String,
    pub payload: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ResolvedRoute {
    pub provider: ProviderKind,
    pub upstream_model: String,
    pub target_endpoint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    pub state: StreamState,
    pub delta: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BoundaryFault {
    EmptyPayload,
    InvalidJson,
    UnknownModel,
    NullPointer,
    BufferOverflow,
}
