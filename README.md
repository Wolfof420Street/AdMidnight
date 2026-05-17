# AdMidnight: Privacy-First Web3 Ad Platform

A monorepo demonstrating zero-knowledge proofs for privacy-preserving online advertising. Users prove segment membership without revealing personal data; advertisers bid in sealed-bid auctions; publishers earn from impressions without tracking.

## Quick Start

### Prerequisites
- **Node.js** 20+ (`node --version`)
- **pnpm** 9+ (`pnpm --version`)
- **Docker** & **Docker Compose** (`docker --version`)
- **Flutter** 3.x (for mobile app)
- **make** (`make --version`)

### One-Shot Startup

```bash
make demo
```

This command:
1. Spins up PostgreSQL, Redis, Midnight node, proof server, indexer
2. Compiles Compact contracts
3. Deploys to local devnet
4. Seeds demo advertiser + campaign + proofs
5. Starts the API at http://localhost:3001/api/v1
6. Starts the dashboard at http://localhost:3000

### Run Tests

```bash
make test
```

Runs all unit and integration tests:
- Contract tests (packages/zk-circuits)
- API integration tests (apps/api)
- Dashboard component tests (apps/advertiser-dashboard)

### Run E2E Demo

```bash
make e2e
```

Exercises the full flow programmatically:
1. Login → 2. Create campaign → 3. Get segments → 4. Submit proof → 5. Bid → 6. Reveal → 7. Claim reward

## What It Does

**Problem**: Online advertising requires sharing personal data (location, interests, browsing history) for targeting.

**Solution**: AdMidnight separates targeting from tracking. Users' devices compute segment membership privately (on-device); the ledger sees only zero-knowledge proofs and aggregate analytics.

**Three Roles**:
- **Users**: Download mobile app, prove they match ad segments → earn rewards
- **Advertisers**: Create campaigns with segment targets, bid in sealed auctions
- **Publishers**: Serve ads, get paid for impressions without seeing user IDs

## Privacy Model

### What Stays on Device
- User's actual data (location, interests, device history) — never leaves the phone
- Witness computation for ZK proofs
- App seed/spending key

### What Hits the Ledger
- Segment IDs (e.g., "tech enthusiasts") — no user data
- Nullifiers: one-way hash of user ID + campaign; uniqueness prevents double-spend
- Auction bids (sealed until reveal) and winners
- Impression counts aggregated per campaign

### What the API Sees
- Campaign definitions (segment centroid, threshold)
- Proof hashes and relay TX hashes
- Auction results and settlements
- No IP addresses, device IDs, or user identifiers

## Technology Stack

**Contracts**: Compact language (zero-knowledge circuits)
**Backend**: NestJS + Prisma + PostgreSQL
**Frontend**: Next.js + React Hook Form + Zod
**Mobile**: Flutter
**Blockchain**: Midnight Network (testnet)
**DevOps**: Docker Compose, turbo

---

**Status**: Hackathon demo. Not production-grade.
- Advertisers get campaign analytics without per-user surveillance.
- Rewards are claimed by nullifier, not identity.
- Auction settlement is still transparent and ledger-enforced.

## Stack

- `apps/advertiser-dashboard`: Next.js 14 dashboard for advertisers
- `apps/api`: NestJS + Fastify API with Prisma persistence and Midnight relays
- `apps/mobile`: Flutter app with on-device proof generation and secure storage
- `packages/zk-circuits`: Compact smart contracts for matching, auction settlement, and rewards
- `packages/shared`: Shared domain types, DTOs, validators, and constants
- `packages/midnight-sdk-wrapper`: Typed Midnight contract gateway
- `docker-compose.yml`: Full local stack orchestration

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [User Flows](docs/USER_FLOWS.md)
- [API Reference](docs/API_REFERENCE.md)

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
```

If you are running the full Docker stack, make sure the Postgres credentials in `.env` are set. The included example values are fine for local development.

### 2. Install workspace dependencies

```bash
corepack enable
pnpm install
```

### 3. Start the full backend stack

```bash
bash infra/docker/start-dev.sh
```

That brings up Midnight node services, the proof server, the indexer, Redis, Postgres, and the API.

### 4. Start the advertiser dashboard

```bash
pnpm -w -r --filter "@admidnight/advertiser-dashboard" run dev
```

### 5. Start the Flutter app

```bash
cd apps/mobile
flutter pub get
make flutter-run
```

## What Judges Should Look At

1. The mobile proof flow generates a match proof locally and submits only the proof envelope.
2. The backend validates and relays the proof through the Midnight gateway.
3. The advertiser dashboard handles campaign creation and sealed-bid auction execution.
4. The Compact contracts enforce the protocol state on-chain, including nullifier-based replay protection.

## Hackathon Features Leveraged

- Midnight programmable data protection for private matching and anonymous rewards.
- Compact ledgers for `proveSegmentMatch`, `commitBid`, `settleAuction`, and `claimReward`.
- Zero-knowledge proof submission and relay from Flutter to NestJS to Midnight.
- Sealed-bid auction flow with commitment hashing.
- Role-gated JWT auth for advertiser, publisher, user, and internal operations.

## Development Commands

```bash
make install
make build
make test
make lint
```

## Notes

- The API serves Swagger at `/docs`.
- Environment variables live in `.env.example` and are validated at startup.
- The local stack expects Postgres through Docker, matching the Prisma schema and compose setup.

