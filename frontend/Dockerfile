FROM node:20-alpine
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files first (cached separately for faster rebuilds)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (fail if lockfile is stale)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm install --frozen-lockfile

# Copy source code (node_modules excluded via .dockerignore)
COPY . .

# Build production bundle
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
