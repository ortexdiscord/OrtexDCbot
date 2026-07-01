# Deploying the Discord Music Bot

This guide covers deploying the bot to **Railway** for 24/7 uptime. The same Docker setup also works on Fly.io, Render, or any VPS.

## What you need

- A GitHub account (the repo is already pushed to `https://github.com/ortexdiscord/OrtexDCbot`).
- A Railway account (free tier available).
- A Postgres database (Railway can provision one automatically).

## Required environment variables

In your Railway project dashboard, add these variables:

| Variable | Description | Example |
|---|---|---|
| `DISCORD_TOKEN` | Your Discord bot token | from Discord Developer Portal |
| `LAVALINK_HOST` | Lavalink node host | `lavalinkv4.serenetia.com` |
| `LAVALINK_PORT` | Lavalink node port | `443` |
| `LAVALINK_PASSWORD` | Lavalink node password | `https://lavalink.dev` or the node’s password |
| `LAVALINK_SECURE` | Use wss:// if `true` | `true` |
| `DATABASE_URL` | Postgres connection string | Railway provides this automatically |
| `SESSION_SECRET` | Random secret for sessions | any long random string |

## 1. Deploy on Railway

1. Go to [railway.com](https://railway.com) and log in.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `ortexdiscord/OrtexDCbot`.
4. Railway will detect the `Dockerfile` and build the project.
5. Add a **Postgres** service to the project (Variables → New → Database → Add PostgreSQL). Railway will expose `DATABASE_URL` automatically.
6. Add the rest of the environment variables above in the service variables.
7. Click **Deploy**.

## 2. Register slash commands

After the first deploy, register the slash commands with Discord:

```bash
# In Railway, open the service console and run:
pnpm --filter @workspace/discord-bot run deploy
```

Or run it locally with the same environment variables:

```bash
cd artifacts/discord-bot
pnpm run deploy
```

You only need to do this once, or whenever you add/change slash commands.

## 3. Run database migrations (first time)

The bot uses Postgres for play history and playlists. Push the schema once:

```bash
# In Railway console or locally with DATABASE_URL set:
pnpm --filter @workspace/db run push
```

## 4. Verify

- Check the Railway logs to confirm the bot logged in and connected to Lavalink.
- In Discord, use `/play` to test.

## Alternative: Fly.io / Render / VPS

Any platform that supports Docker can run the same `Dockerfile`. Just set the environment variables above and run:

```bash
docker build -t discord-bot .
docker run -e DISCORD_TOKEN=... -e DATABASE_URL=... discord-bot
```
