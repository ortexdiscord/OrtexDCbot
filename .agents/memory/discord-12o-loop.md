---
name: Discord 12o continuous playlist loop
description: Stable playlist looping without relying on ever-growing playback history.
---

# Discord 12o continuous playlist loop

"12o" means the current playlist loops continuously when the queue ends.

**How to apply:**
- When the user enables 12o, capture a stable snapshot once: `previous + current + upcoming` tracks at that moment.
- Store the snapshot on the player (e.g., `player.twelveOSnapshot`).
- On `queueEnd`, if 12o is enabled and the snapshot is non-empty, re-add the snapshot to the queue and call `player.play()`.
- When 12o is disabled, clear the snapshot.

**Why:** Using `player.queue.previous` at each `queueEnd` causes drift and duplicates because `previous` accumulates across every loop cycle. A snapshot preserves the intended playlist order and contents.
