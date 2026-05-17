import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublisherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordImpression(params: {
    slotId: string;
    nullifier: string;
    proofHash: string;
    payoutMidnight: string;
  }): Promise<string> {
    const id = randomUUID();
    await this.prisma.publisherImpression.create({
      data: {
        id,
        slotId: params.slotId,
        nullifier: params.nullifier,
        proofHash: params.proofHash,
        payoutMidnight: params.payoutMidnight,
        createdAt: new Date(),
      },
    });
    return id;
  }

  async getRevenueDashboard(): Promise<{
    totalEarned: string;
    pendingSettlement: string;
    impressionCount: number;
  }> {
    const result = (await this.prisma.$queryRaw`
      SELECT COALESCE(SUM(CAST(payout_midnight AS INTEGER)), 0) AS total_earned,
             COUNT(*) AS impression_count
      FROM publisher_impressions
    `) as Array<{ total_earned: number | null; impression_count: number }>;

    const row = result[0] ?? { total_earned: 0, impression_count: 0 };
    return {
      totalEarned: String(row.total_earned ?? 0),
      pendingSettlement: '0',
      impressionCount: Number(row.impression_count ?? 0),
    };
  }
}
