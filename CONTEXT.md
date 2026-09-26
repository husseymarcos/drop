# Drop

Drop is an ephemeral file-sharing server that moves files between devices on the same local network — never over the internet, never to disk.

## Language

**Drop**:
A single shared resource — one file, or one directory archived into a tar — that stays downloadable until it expires.
_Avoid_: session, share, transfer

**DropAddress**:
Where a drop is reachable: at the root path (alias mode) or at a slug path.
_Avoid_: route, slot, URL

**Slug**:
The human-readable, unique path segment that addresses a drop, e.g. `swift-wave-402`.
_Avoid_: id, key, token

**DropContent**:
The bytes of a drop together with the file name and MIME type they are served as.
_Avoid_: payload, body, blob

**DropLedger**:
The authoritative in-memory record of live drops. Assigns identity and expiry, and answers lookups.
_Avoid_: store, registry, cache

**Expiry**:
The moment a drop stops being reachable, derived from the duration chosen when it was created.
_Avoid_: TTL, timeout

**Alias**:
A friendly mDNS host name (e.g. `john.local`) a drop may be published under. Drops published this way are reachable at the root path.
_Avoid_: hostname, domain
