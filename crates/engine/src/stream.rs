use crate::types::{StreamChunk, StreamState};
use std::collections::VecDeque;

pub struct StreamSession {
    queue: VecDeque<StreamChunk>,
}

impl StreamSession {
    pub fn new(chunks: Vec<String>) -> Self {
        let queue = chunks
            .into_iter()
            .map(|delta| StreamChunk {
                state: StreamState::Streaming,
                delta,
            })
            .collect();
        Self { queue }
    }

    pub fn poll_next(&mut self) -> StreamChunk {
        self.queue.pop_front().unwrap_or(StreamChunk {
            state: StreamState::Completed,
            delta: String::new(),
        })
    }
}
