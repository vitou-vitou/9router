use crate::types::{BoundaryFault, IngressEnvelope};
use serde_json::from_slice;

pub fn validate_and_parse(raw_bytes: &[u8]) -> Result<IngressEnvelope, BoundaryFault> {
    raw_bytes
        .is_empty()
        .then_some(Err(BoundaryFault::EmptyPayload))
        .unwrap_or_else(|| {
            from_slice::<IngressEnvelope>(raw_bytes).map_err(|_| BoundaryFault::InvalidJson)
        })
}
