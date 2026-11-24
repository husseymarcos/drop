# Drop identity, addressing, and expiry live in the DropLedger

Drops used to be assembled by a `DropFactory` and parked in a passive `DropStore`, which spread identity (slug or alias), uniqueness, and expiry across two modules and the entity. The alias case travelled as an empty-string slug, and `DropStore.find` delegated expiry to a wall-clock getter on `Drop`, so the store never knew the time. We consolidated creation, identity assignment, uniqueness, expiry, and lookup into one `DropLedger` with an injected clock and slug source, and made a drop addressable by a typed `DropAddress` (root or slug) rather than a string. Downloads deliberately do not consume a drop: it stays reachable until its duration elapses.

## Consequences

- The empty-string slug sentinel is gone; the root case is a typed address.
- Expiry is enforced only by `DropLedger.resolve`, so expiry tests advance an injected clock instead of sleeping.
- `DropFactory` and `DropStore` are deleted. `FileLoader` now returns `DropContent` and the ledger assigns identity.
- A drop cannot be single-use; self-destruct is purely time-based, matching the multi-download behavior chosen earlier.
