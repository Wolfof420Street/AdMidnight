# User Flows

## Advertiser Journey

The advertiser flow is authenticated with JWT and is intentionally scoped to the `advertiser` role.

1. The advertiser logs in through `POST /auth/login`.
2. The backend issues an HttpOnly session cookie and, for mobile clients, also returns the bearer token in the JSON response.
3. The dashboard creates a campaign with `POST /advertiser/campaign/create` using a nested segment config and creative payload.
4. The API persists the campaign in Prisma, hashes the targeting segment into a commitment, and registers the segment on Midnight through `registerSegment`.
5. The campaign becomes active after the on-chain transaction hash is recorded.
6. The advertiser can list campaigns with `GET /advertiser/campaign` and inspect aggregate analytics with `GET /advertiser/campaign/:id/analytics`.
7. To participate in bidding, the advertiser submits a sealed commitment with `POST /advertiser/auction/bid`.
8. When bidding is complete, the advertiser reveals the bid with `POST /advertiser/auction/reveal`, which routes into the auction engine and the Midnight gateway.
9. The final auction state is available through `GET /advertiser/auction/:id/result`.

What the code actually stores:

- Campaign metadata and lifecycle status in Prisma.
- Bid commitment hashes in Prisma and on-chain auction state.
- Aggregated impression counts from the proof repository.

## User Journey

The user-facing flow is mobile-first and privacy-preserving.

1. The mobile app loads active campaigns and segment definitions through `GET /user/segments/available`.
2. The app generates a local behavioral embedding and computes cosine similarity on-device in `apps/mobile/lib/features/matching/domain/zk_proof_engine.dart`.
3. If the match threshold is met, the app builds a proof envelope containing `proofBytes`, `publicInputs`, `generatedAt`, and the `proveSegmentMatch` circuit name.
4. The mobile client submits that envelope to `POST /user/proof/match`.
5. The backend validates the envelope shape, public inputs, and timestamps, then relays the proof to Midnight via `submitMatchProof`.
6. The backend records the proof hash and public-input hash in Prisma, then creates a pending reward entry.
7. The backend escrows a reward on-chain using `escrowReward` and returns a proof verification response.
8. The user can inspect pending rewards with `GET /user/rewards/pending`.
9. To claim the reward, the mobile app submits `POST /user/rewards/claim` or `POST /user/claim` with the nullifier and proof bytes.
10. The backend checks the pending reward, calls Midnight `claimReward`, and marks the reward as claimed.

## Publisher Journey

The publisher path is tied to a validated match proof and a unique nullifier.

1. The publisher registers an impression with `POST /publisher/impression/register`.
2. The backend checks that the match proof nullifier has already been validated in the proof repository.
3. The backend hashes the match proof bytes and stores the impression in the publisher repository.
4. The publisher can view aggregate revenue with `GET /publisher/revenue/dashboard`.

## Internal Validation Journey

The internal path is role-gated and used for proof verification without ledger submission.

1. A principal with the `internal` role calls `POST /internal/proof/validate`.
2. The backend validates proof bytes, circuit name, public inputs, and timestamp.
3. The response returns whether the proof is valid and the public outputs associated with that proof.

## API Surface Summary

### Auth

- `POST /auth/login` returns a session cookie and, for mobile clients, a token in the response body.
- `POST /auth/logout` clears the session cookie.

### User

- `POST /user/proof/match`
- `POST /user/rewards/claim`
- `POST /user/claim`
- `GET /user/rewards/pending`
- `GET /user/segments/available`

### Advertiser

- `POST /advertiser/campaign/create`
- `GET /advertiser/campaign`
- `GET /advertiser/campaign/:id/analytics`
- `POST /advertiser/auction/bid`
- `POST /advertiser/auction/reveal`
- `GET /advertiser/auction/:id/result`

### Publisher

- `POST /publisher/impression/register`
- `GET /publisher/revenue/dashboard`

### Internal

- `POST /internal/proof/validate`
