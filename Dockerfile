FROM node:20-slim

# Install git (some pnpm packages may need it during install)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy package.json files for the workspace packages we need
# This lets Docker cache the dependency layer if only source code changes
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/discord-bot/package.json ./artifacts/discord-bot/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY lib/db ./lib/db
COPY artifacts/discord-bot ./artifacts/discord-bot

# Start the Discord bot
CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
