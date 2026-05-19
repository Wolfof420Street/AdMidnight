FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.7 --activate
RUN pnpm config set fetch-retries 5 && pnpm config set fetch-timeout 600000 && pnpm config set network-concurrency 1

COPY package.json pnpm-lock.yaml turbo.json tsconfig.base.json pnpm-workspace.yaml ./
COPY apps/advertiser-dashboard/package.json ./apps/advertiser-dashboard/
COPY packages ./packages

RUN pnpm install --filter "@admidnight/advertiser-dashboard..." --frozen-lockfile --ignore-scripts

COPY apps/advertiser-dashboard ./apps/advertiser-dashboard

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=development
RUN corepack enable && corepack prepare pnpm@8.6.7 --activate

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/advertiser-dashboard ./apps/advertiser-dashboard

EXPOSE 3000

CMD ["pnpm", "--filter", "@admidnight/advertiser-dashboard", "dev", "--", "-H", "0.0.0.0"]
