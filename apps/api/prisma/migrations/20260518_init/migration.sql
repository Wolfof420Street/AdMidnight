-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "segmentCentroid" TEXT NOT NULL,
    "similarityThreshold" DOUBLE PRECISION NOT NULL,
    "targetCategories" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "clickUrl" TEXT NOT NULL,
    "advertiserName" TEXT NOT NULL,
    "budgetMidnight" TEXT NOT NULL,
    "cpmBidMidnight" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "midnightTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "commitmentHash" TEXT NOT NULL,
    "actualBid" TEXT,
    "nonce" TEXT,
    "revealedAt" TIMESTAMP(3),
    "won" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofRecord" (
    "nullifier" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "publicInputHash" TEXT NOT NULL,
    "isMatch" BOOLEAN NOT NULL,
    "relayTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofRecord_pkey" PRIMARY KEY ("nullifier")
);

-- CreateTable
CREATE TABLE "RewardClaim" (
    "nullifier" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amountMidnight" TEXT NOT NULL,
    "claimTxHash" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("nullifier")
);

-- CreateTable
CREATE TABLE "PublisherImpression" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "nullifier" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "payoutMidnight" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublisherImpression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_segmentId_key" ON "Campaign"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_creativeId_key" ON "Campaign"("creativeId");

-- CreateIndex
CREATE INDEX "Campaign_advertiserId_idx" ON "Campaign"("advertiserId");

-- CreateIndex
CREATE INDEX "Campaign_status_startTime_endTime_idx" ON "Campaign"("status", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Bid_campaignId_idx" ON "Bid"("campaignId");

-- CreateIndex
CREATE INDEX "Bid_advertiserId_idx" ON "Bid"("advertiserId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_campaignId_advertiserId_key" ON "Bid"("campaignId", "advertiserId");

-- CreateIndex
CREATE INDEX "ProofRecord_campaignId_idx" ON "ProofRecord"("campaignId");

-- CreateIndex
CREATE INDEX "ProofRecord_campaignId_isMatch_idx" ON "ProofRecord"("campaignId", "isMatch");

-- CreateIndex
CREATE INDEX "RewardClaim_campaignId_idx" ON "RewardClaim"("campaignId");

-- CreateIndex
CREATE INDEX "RewardClaim_status_createdAt_idx" ON "RewardClaim"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublisherImpression_nullifier_key" ON "PublisherImpression"("nullifier");

-- CreateIndex
CREATE INDEX "PublisherImpression_slotId_idx" ON "PublisherImpression"("slotId");

-- CreateIndex
CREATE INDEX "PublisherImpression_createdAt_idx" ON "PublisherImpression"("createdAt");

-- Add foreign key constraints to enforce relational integrity
ALTER TABLE "Bid"
    ADD CONSTRAINT "Bid_campaign_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE;

ALTER TABLE "ProofRecord"
    ADD CONSTRAINT "ProofRecord_campaign_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE;

ALTER TABLE "RewardClaim"
    ADD CONSTRAINT "RewardClaim_campaign_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE;

ALTER TABLE "PublisherImpression"
    ADD CONSTRAINT "PublisherImpression_proof_fkey" FOREIGN KEY ("nullifier") REFERENCES "ProofRecord"("nullifier") ON DELETE CASCADE;

