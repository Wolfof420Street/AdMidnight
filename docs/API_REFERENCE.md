# API Reference

This document is a Markdown substitute for an OpenAPI export. The NestJS app currently mounts Swagger at `/docs`, but no generated spec file is committed, so this reference reflects the live controllers and DTOs in the repository.

## Common Conventions

- Base prefix: `/api/v1`
- Authentication: JWT bearer token or HttpOnly cookie depending on client
- Validation: NestJS global validation pipes reject unknown properties and coerce primitive types where safe
- Response wrapper: many shared types use `{ success, data, timestamp, requestId }` in the shared package, but controller return values are often direct DTOs

## Auth

### `POST /auth/login`

Issues an advertiser session cookie. Mobile clients may send `X-Client: mobile` and receive the JWT token in the response body.

Request body:

- `email: string`
- `password: string`

Response body:

- `sub: string`
- `role: 'advertiser'`
- `email: string`
- `name: string`
- `expiresAt: string`
- `token?: string` for mobile clients

### `POST /auth/logout`

Clears the auth cookie and returns `{ cleared: true }`.

## User

### `POST /user/proof/match`

Submits a ZK proof of ad match.

Request body:

- `proofBytes: string`
- `publicInputs.segmentId: string`
- `publicInputs.campaignId: string`
- `publicInputs.isMatch: boolean`
- `publicInputs.nullifier: string`
- `generatedAt: string`

Response body:

- `valid: boolean`
- `campaignId: string`
- `rewardEscrow: string`
- `relayTxHash?: string`

### `POST /user/rewards/claim`

Claims a reward using the nullifier and proof bytes.

Request body:

- `nullifier: string`
- `zkProof: string`

Response body:

- `txHash: string`
- `amountMidnight: string`
- `status: 'CLAIMED' | 'FAILED'`

### `POST /user/claim`

Alias for reward claim.

### `GET /user/rewards/pending`

Returns pending anonymous rewards.

Response shape:

- `nullifier: string`
- `amount: string`
- `campaignId: string`
- `escrowedTimestamp: string`

### `GET /user/segments/available`

Returns public segment definitions for on-device matching.

## Advertiser

These routes require the `advertiser` role.

### `POST /advertiser/campaign/create`

Request body:

- `segmentConfig.centroid: number[]` with 128 entries
- `segmentConfig.similarityThreshold: number` in `[0, 1]`
- `segmentConfig.targetCategories: string[]`
- `creative.title: string`
- `creative.description: string`
- `creative.imageUrl: string`
- `creative.clickUrl: string`
- `creative.advertiserName: string`
- `budgetMidnight: string`
- `cpmBidMidnight: string`
- `startTime: string`
- `endTime: string`

### `GET /advertiser/campaign`

Lists campaigns for the authenticated advertiser.

### `GET /advertiser/campaign/:id/analytics`

Returns aggregated analytics only:

- `impressions: number`
- `estimatedCtr: number`
- `totalSpend: string`

### `POST /advertiser/auction/bid`

Request body:

- `campaignId: string`
- `commitmentHash: string`

Response body:

- `txHash: string`
- `bidReceiptId: string`

### `POST /advertiser/auction/reveal`

Request body:

- `campaignId: string`
- `actualBid: string`
- `nonce: string`

Response body:

- `campaignId: string`
- `winnerAdvertiserId: string`
- `impressionCount: number`
- `totalSpend: string`
- `settlementTxHash: string`
- `settledAt: string`

### `GET /advertiser/auction/:id/result`

Returns the auction result for the campaign.

## Publisher

These routes require the `publisher` role.

### `POST /publisher/impression/register`

Request body:

- `slotId: string`
- `matchProofNullifier: string`
- `matchProofBytes: string`

Response body:

- `auctionId: string`
- `estimatedPayout: string`

### `GET /publisher/revenue/dashboard`

Response body:

- `totalEarned: string`
- `pendingSettlement: string`
- `impressionCount: number`

## Internal

These routes require the `internal` role.

### `POST /internal/proof/validate`

Request body:

- `proofBytes: string`
- `circuit: string`
- `publicInputs: Record<string, unknown>`
- `generatedAt: string`

Response body:

- `valid: boolean`
- `publicOutputs: Record<string, unknown>`