# Drop

Drop is an ephemeral file-sharing server that moves files between devices on the same local network — never over the internet, and it never writes to disk.

## Language

**Drop**:
A single shared resource — one file, or one directory archived into a tar — that stays downloadable until it expires.
_Avoid_: session, share, transfer

**DropAddress**:
Where a drop is reachable: at the root path (alias mode) or at a slug path.
_Avoid_: route, slot, URL

**Slug**:
The human-readable, unique path segment that addresses a drop, e.g. `brave-otter-k7m2q9xd`. The random token at the end makes it hard to guess.
_Avoid_: id, key, token

**DropContent**:
What a drop serves: file name, MIME type, size, and a way to open the bytes for each download.
_Avoid_: payload, body, blob

**DropLedger**:
The authoritative in-memory record of live drops. Assigns identity and expiry, and answers lookups.
_Avoid_: store, registry, cache

**Expiry**:
The moment a drop stops being reachable, derived from the duration chosen when it was created.
_Avoid_: TTL, timeout

**Receive mode**:
The opt-in mode (`drop receive`) where the root page accepts uploads; each upload becomes its own drop. Without it, the upload endpoint does not exist.
_Avoid_: upload server, inbox

**Alias**:
A friendly mDNS host name (e.g. `john.local`) a drop may be published under. Drops published this way are reachable at the root path.
_Avoid_: hostname, domain
