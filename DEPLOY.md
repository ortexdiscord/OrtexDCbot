# Deploying the Discord Music Bot for 24/7 uptime

The bot is in `artifacts/discord-bot` and depends on the `lib/db` workspace package. Any Docker-capable host can run it.

## Required environment variables

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your Discord bot token |
| `LAVALINK_HOST` | Lavalink node host |
| `LAVALINK_PORT` | Lavalink node port |
| `LAVALINK_PASSWORD` | Lavalink node password |
| `LAVALINK_SECURE` | `true` if the node uses wss:// |
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Random secret string |

## Option 1: Fly.io (best free PaaS option)

Fly.io gives you a free allowance that is enough for one small Discord bot to run 24/7.

1. Install the Fly.io CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Log in: `fly auth login`
3. From the repo root, run: `fly launch --dockerfile Dockerfile`
   - Choose a unique app name when it asks.
4. Add the environment variables:
   ```bash
   fly secrets set DISCORD_TOKEN=...
   fly secrets set LAVALINK_HOST=...
   fly secrets set LAVALINK_PORT=...
   fly secrets set LAVALINK_PASSWORD=...
   fly secrets set LAVALINK_SECURE=...
   fly secrets set DATABASE_URL=...
   fly secrets set SESSION_SECRET=...
   ```
5. Deploy: `fly deploy`
6. Register slash commands once:
   ```bash
   fly ssh console
   pnpm --filter @workspace/discord-bot run deploy
   pnpm --filter @workspace/db run push
   exit
   ```

The `fly.toml` file is already included.

## Option 2: Oracle Cloud Free Tier (truly free forever)

Oracle Cloud offers an **Always Free** tier with ARM/AMD VMs. This is the only major provider with a contractually free-forever tier.

1. Sign up at https://www.oracle.com/cloud/free/ (requires a credit card for verification, but you are not charged while on the Always Free tier).
2. Create an Ubuntu VM in the Always Free tier.
3. SSH into the VM and run:
   ```bash
   sudo apt update && sudo apt install -y docker.io git
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   newgrp docker
   git clone https://github.com/ortexdiscord/OrtexDCbot.git
   cd OrtexDCbot
   docker build -t discord-bot .
   docker run -d --name discord-bot --restart unless-stopped \
     -e DISCORD_TOKEN=... \
     -e LAVALINK_HOST=... \
     -e LAVALINK_PORT=... \
     -e LAVALINK_PASSWORD=... \
     -e LAVALINK_SECURE=... \
     -e DATABASE_URL=... \
     -e SESSION_SECRET=... \
     discord-bot
   ```
4. Register slash commands once (run inside the container):
   ```bash
   docker exec -it discord-bot pnpm --filter @workspace/discord-bot run deploy
   docker exec -it discord-bot pnpm --filter @workspace/db run push
   ```

You need to provision Postgres separately (Oracle Cloud Free Tier also includes an Always Free Autonomous Database, or you can run a small Postgres container).

## Option 3: Railway (easiest, but not free forever)

Railway is the easiest to deploy from GitHub, but after the trial month it requires a paid plan (~$5/month).

1. Go to [railway.com](https://railway.com) and log in.
2. **New Project → Deploy from GitHub repo → `OrtexDCbot`**.
3. Railway will detect the `Dockerfile` and build it.
4. Add a **Postgres** service (New → Database → PostgreSQL).
5. Add the environment variables in the service variables panel.
6. Deploy.
7. In the Railway console run once:
   - `pnpm --filter @workspace/discord-bot run deploy`
   - `pnpm --filter @workspace/db run push`

## Recommended choice

- **Want the easiest setup?** → Railway (paid after the first month).
- **Want free without credit card?** → Fly.io.
- **Want free forever with a credit card on file?** → Oracle Cloud Free Tier.

If you pick one, let me know and I can add a deploy script or GitHub Action to make it one-click.
