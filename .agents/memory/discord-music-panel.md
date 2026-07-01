---
name: Discord music panel lifecycle
description: How the now-playing panel should be managed so only one persistent panel exists per player.
---

# Discord music panel lifecycle

Rule: there must be exactly one persistent now-playing panel message in the text channel.

**How to apply:**
- Do not delete/clear the stored `panelMessageId` on `trackEnd` — the panel should remain visible until the next track replaces it.
- On `trackStart`, fetch the old panel by its stored message/channel IDs, delete it, then post a new panel and store the new IDs.
- On `playerDestroy` (stop, empty-queue timeout, empty-channel auto-leave, etc.), delete the panel message and clear the stored IDs.
- Other ephemeral command/button replies must not be stored as the panel.

**Why:** Clearing the panel ID in `trackEnd` makes the next `trackStart` unable to find the old panel, causing panels to accumulate across tracks. Deleting the old panel on `trackStart` is the only moment where both the old and new message IDs are known.
