import type { OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersistenceBootstrapService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS advertisers (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        advertiser_id TEXT NOT NULL,
        segment_id TEXT NOT NULL UNIQUE,
        creative_id TEXT NOT NULL UNIQUE,
        segment_centroid TEXT NOT NULL,
        similarity_threshold REAL NOT NULL,
        target_categories TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        click_url TEXT NOT NULL,
        advertiser_name TEXT NOT NULL,
        budget_midnight TEXT NOT NULL,
        cpm_bid_midnight TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL,
        midnight_tx_hash TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS bids (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        advertiser_id TEXT NOT NULL,
        commitment_hash TEXT NOT NULL,
        actual_bid TEXT,
        nonce TEXT,
        revealed_at TEXT,
        won INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(campaign_id, advertiser_id)
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS proof_records (
        nullifier TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        segment_id TEXT NOT NULL,
        proof_hash TEXT NOT NULL,
        public_input_hash TEXT NOT NULL,
        is_match INTEGER NOT NULL,
        relay_tx_hash TEXT,
        created_at TEXT NOT NULL
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS reward_claims (
        nullifier TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        amount_midnight TEXT NOT NULL,
        claim_tx_hash TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS publisher_impressions (
        id TEXT PRIMARY KEY,
        slot_id TEXT NOT NULL,
        nullifier TEXT NOT NULL UNIQUE,
        proof_hash TEXT NOT NULL,
        payout_midnight TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `;
  }
}
