---
name: lavalink-client v2 API
description: Correct API usage for lavalink-client v2.10+ in this workspace. Key differences from what you might expect.
---

## Search
Search is on the **player**, NOT the manager:
```typescript
player.search({ query, source: "ytsearch" }, requestUser) // plain text
player.search({ query }, requestUser) // URLs — no source, let Lavalink auto-detect
```

## Node Events
Node-level events (connect/disconnect/error) are on `lavalink.nodeManager`, NOT `lavalink` directly:
```typescript
lavalink.nodeManager.on("connect", (node) => { ... });
lavalink.nodeManager.on("disconnect", (node, reason) => { ... });
lavalink.nodeManager.on("error", (node, error) => { ... });
```

## LavalinkNodeOptions
Use `secure` not `ssl`:
```typescript
{ authorization: "...", host: "...", port: 443, id: "main", secure: true }
```

## Event Callback Signatures
- `trackStart: (player, track: Track | null, payload: TrackStartEvent) => void`
- `trackEnd: (player, track: Track | null, payload: TrackEndEvent) => void`
- `queueEnd: (player, track: Track | UnresolvedTrack | null, payload: ...) => void`
- `playerDisconnect: (player, voiceChannelId: string) => void`

## PlaylistInfo
`result.playlist?.name` — NOT `result.playlist?.info.name`. PlaylistInfo has `name` directly.

## TypeScript
- Bot tsconfig must use `"moduleResolution": "bundler"` (extend base, don't override to NodeNext) for @workspace/* imports to resolve correctly
- `player.queue.current` and `queue.tracks` may be typed as `Track | UnresolvedTrack` — cast with `as unknown as Track` when needed
- Channel sendability: after `channel.isTextBased()`, check `'send' in channel` to exclude PartialGroupDMChannel

**Why:** lavalink-client v2.10+ moved search to the player to allow per-node search routing. Node events were always on nodeManager. These differences caused typecheck failures on the first build.
