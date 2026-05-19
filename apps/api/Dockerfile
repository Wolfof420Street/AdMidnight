FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.7 --activate
RUN pnpm config set fetch-retries 5 && pnpm config set fetch-timeout 600000 && pnpm config set network-concurrency 1

# Copy manifests
COPY package.json turbo.json tsconfig.base.json ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/midnight-sdk-wrapper/package.json ./packages/midnight-sdk-wrapper/

# Install only the API workspace and its transitive workspace deps.
RUN pnpm install --filter "@admidnight/api..." --no-frozen-lockfile --ignore-scripts

# Copy source
COPY apps/api ./apps/api
COPY packages ./packages
COPY scripts ./scripts

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development

RUN apk add --no-cache bash
RUN corepack enable && corepack prepare pnpm@8.6.7 --activate

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/scripts ./scripts

# Copy healthcheck/wait helper
COPY --from=builder /app/scripts/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh || true
RUN pnpm --filter "@admidnight/api" exec prisma generate --schema=prisma/schema.prisma

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["/bin/sh", "-c", "/usr/local/bin/wait-for-it.sh postgres:5432 --timeout=60 -- pnpm --filter \"@admidnight/api\" dev"]
