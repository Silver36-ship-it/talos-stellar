## feat(contracts): expose typed event schema version helper

### Overview
Introduces a typed [event_schema_version()](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:150:4-166:5) helper on both [TalosRegistry](cci:2://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_registry/src/lib.rs:130:0-130:25) and [TalosNameService](cci:2://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:82:0-82:28).
Off-chain indexers can call this method once at start-up to confirm the event schema major version
they were built against before processing on-chain events.

### Problem
There was no on-chain signal for indexers to detect breaking changes to event payloads. A schema
change would cause silent misparsing downstream. This PR establishes a clear versioning contract
between the Soroban contracts and their consumers.

### Solution
A compile-time `EventSchemaVersion { major, minor }` constant is defined as the single source of
truth. The [event_schema_version()](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:150:4-166:5) method returns it as a typed, XDR-serialisable value. A
`SUPPORTED_MAJOR` guard ensures the method panics on any accidental mis-deployment where the
constant is changed without bumping the guard.

### Changes
| Item | Detail |
|---|---|
| [EventSchemaVersion](cci:2://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_registry/src/lib.rs:41:0-44:1) struct | `#[contracttype]`, XDR-serialisable, fields: `major: u32`, `minor: u32` |
| `EVENT_SCHEMA_VERSION` | Public compile-time constant — `{ major: 1, minor: 0 }` |
| `SUPPORTED_MAJOR` | Private rejection guard — panics on unsupported major |
| [event_schema_version()](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:150:4-166:5) | Pure-read contract method — no storage, no fees |
| Rustdoc `# Event Schema` table | Documents every event name, topics, and data fields per contract |

Applied identically to `talos_registry` and `talos_name_service`.

### Scope — unchanged
- Event names `tls_crt`, `pat_upd`, [name_reg](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:65:0-68:1)
- Topics and data field order for all events
- All existing public contract methods
- No new storage keys introduced

### Tests
Four focused tests added inside existing `mod tests` blocks (local fixtures, no network):

| Test | Assertion |
|---|---|
| [event_schema_version_returns_expected_value](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_registry/src/lib.rs:407:4-417:5) | `major == 1`, `minor == 0` |
| [event_schema_version_major_is_supported](cci:1://file:///c:/Users/USER/Downloads/talos-stellar/contracts/talos_name_service/src/lib.rs:192:4-205:5) | `major == SUPPORTED_MAJOR` |

Both tests are present in each contract (four total).

### Acceptance criteria
- [x] Value is deterministic and documented
- [x] Existing event names and field order unchanged
- [x] Unsupported major versions rejected
- [x] Focused tests with local fixtures included
