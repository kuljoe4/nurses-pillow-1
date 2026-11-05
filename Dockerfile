# Use a pinned Node LTS image and build with Docker instead of Railpack.
# This avoids Railpack's external mise bootstrap download during deployment.
FROM node:22-bookworm-slim

WORKDIR /app
ENV CI=true

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "start"]
