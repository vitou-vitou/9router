# Domain Context: Universal Native Core (Rust FFI & Wasm)

## Ubiquitous Language

### Gateway & Router
* **Engine**: The stateless core responsible for message translation, route resolution, and lifecycle state management.
* **Provider**: An upstream model service (e.g., Anthropic, OpenAI, Gemini) conforming to a strict payload contract.
* **Route**: An immutable mapping resolving a client-requested model identifier to an upstream endpoint configuration.

### Data Flow & Boundary
* **Payload**: Raw byte buffer crossing the FFI or network boundary.
* **Envelope**: Strictly typed, deserialized wire entity. Must pass boundary validation before processing.
* **StreamChunk**: A single discrete delta in an active stream lifecycle.
* **StreamState**: Exhaustive enumeration of connection lifecycles: `Idle`, `Connecting`, `Streaming`, `Completed`, `Failed`.

### Reliability & Error
* **BoundaryFault**: Structured failure produced when ingress data fails structural or cryptographic checks.
* **TransportFault**: Network-level disruption (timeout, disconnect, malformed SSE frame).
* **DispatchMap**: Keyed table dispatch replacing imperative conditional branches.
