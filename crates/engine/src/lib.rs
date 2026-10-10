pub mod router;
pub mod stream;
pub mod types;
pub mod validator;

use router::resolve;
use serde_json::to_vec;
use std::slice::from_raw_parts;
use stream::StreamSession;
use types::BoundaryFault;
use validator::validate_and_parse;

#[repr(C)]
pub struct ByteBuffer {
    pub ptr: *mut u8,
    pub len: usize,
    pub cap: usize,
}

impl ByteBuffer {
    fn from_vec(mut v: Vec<u8>) -> Self {
        let buf = Self {
            ptr: v.as_mut_ptr(),
            len: v.len(),
            cap: v.capacity(),
        };
        std::mem::forget(v);
        buf
    }
}

#[no_mangle]
pub unsafe extern "C" fn engine_process_envelope(ptr: *const u8, len: usize) -> ByteBuffer {
    ptr.is_null()
        .then(|| to_vec(&Err::<(), _>(BoundaryFault::NullPointer)).unwrap_or_default())
        .map(ByteBuffer::from_vec)
        .unwrap_or_else(|| {
            let slice = from_raw_parts(ptr, len);
            let result = validate_and_parse(slice).and_then(|env| resolve(&env.model));
            let out_bytes = to_vec(&result).unwrap_or_default();
            ByteBuffer::from_vec(out_bytes)
        })
}

#[no_mangle]
pub unsafe extern "C" fn engine_buffer_free(buf: ByteBuffer) {
    (!buf.ptr.is_null()).then(|| drop(Vec::from_raw_parts(buf.ptr, buf.len, buf.cap)));
}

#[no_mangle]
pub extern "C" fn engine_session_create() -> *mut StreamSession {
    Box::into_raw(Box::new(StreamSession::new(vec![])))
}

#[no_mangle]
pub unsafe extern "C" fn engine_session_poll(session: *mut StreamSession) -> ByteBuffer {
    session
        .as_mut()
        .map(|s| to_vec(&s.poll_next()).unwrap_or_default())
        .map(ByteBuffer::from_vec)
        .unwrap_or_else(|| {
            ByteBuffer::from_vec(
                to_vec(&Err::<(), _>(BoundaryFault::NullPointer)).unwrap_or_default(),
            )
        })
}

#[no_mangle]
pub unsafe extern "C" fn engine_session_free(session: *mut StreamSession) {
    (!session.is_null()).then(|| drop(Box::from_raw(session)));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_route_dispatch() {
        let payload = br#"{"model":"gpt-4o","payload":"hello"}"#;
        unsafe {
            let buf = engine_process_envelope(payload.as_ptr(), payload.len());
            assert!(!buf.ptr.is_null());
            assert!(buf.len > 0);
            engine_buffer_free(buf);
        }
    }

    #[test]
    fn test_empty_payload_fails_cleanly() {
        let payload = b"";
        unsafe {
            let buf = engine_process_envelope(payload.as_ptr(), payload.len());
            let out = from_raw_parts(buf.ptr, buf.len);
            let res: Result<types::ResolvedRoute, BoundaryFault> =
                serde_json::from_slice(out).unwrap();
            assert_eq!(res, Err(BoundaryFault::EmptyPayload));
            engine_buffer_free(buf);
        }
    }
}
