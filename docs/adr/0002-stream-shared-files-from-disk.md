# Shared files stream from disk; only uploads live in memory

Drop used to read the whole shared file (or a tar of the whole folder) into a `Buffer` before printing the link. A 1 GB file cost about 1 GB of memory at rest and about 2 GB while it was being downloaded. `DropContent` now carries a size and a `body()` factory instead of bytes. Shared files are served as lazy `Bun.file` blobs, and folders are streamed as a tar generated on the fly with a precomputed `Content-Length`. Uploads in `drop receive` are still held in memory, because the request body has nowhere else to go without writing to disk, and they are capped by `--max-upload`.

## Consequences

- "Files live only in RAM" no longer describes the sender's side. The README states the real guarantee: the link stops accepting requests when it expires, and Drop makes no claims about deletion or encryption.
- If a shared file changes on disk while Drop runs, downloads reflect the new contents. A folder entry that shrinks after Drop starts can produce a short tar; Drop does not lock files.
- Every download opens a fresh stream, so several people can download the same drop at once.
