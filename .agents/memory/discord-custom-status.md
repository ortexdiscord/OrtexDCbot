---
name: Discord bot custom status
description: Correct custom-status format so a Discord bot appears online, not invisible.
---

# Discord bot custom status

To show a custom status text and avoid the bot appearing offline, use the following activity format with Discord.js v14:

```ts
client.user.setPresence({
  activities: [{ name: "", state: "Your status text", type: ActivityType.Custom }],
  status: "online",
});
```

**Why:** `name` must be an empty string for custom statuses; the visible text goes in `state`. Omitting `status: "online"` or using `activities: []` makes the bot appear offline even though it is connected.
