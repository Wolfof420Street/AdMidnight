import { Injectable } from '@nestjs/common';
import type { CampaignResponseDto } from '@admidnight/shared';
import { PrismaService } from '../../prisma/prisma.service';

type CampaignRow = {
  id: string;
  advertiserId: string;
  segmentId: string;
  creativeId: string;
  segmentCentroid: string;
  similarityThreshold: number;
  targetCategories: string;
  title: string;
  description: string;
  imageUrl: string;
  clickUrl: string;
  advertiserName: string;
  budgetMidnight: string;
  cpmBidMidnight: string;
  startTime: Date;
  endTime: Date;
  status: string;
  midnightTxHash: string | null;
};

const CAMPAIGN_COLUMNS = `
  id,
  advertiser_id,
  segment_id,
  creative_id,
  segment_centroid,
  similarity_threshold,
  target_categories,
  title,
  description,
  image_url,
  click_url,
  advertiser_name,
  budget_midnight,
  cpm_bid_midnight,
  start_time,
  end_time,
  status,
  midnight_tx_hash
`;

@Injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    id: string;
    advertiserId: string;
    segmentId: string;
    creativeId: string;
    centroid: number[];
    similarityThreshold: number;
    targetCategories: string[];
    title: string;
    description: string;
    imageUrl: string;
    clickUrl: string;
    advertiserName: string;
    budgetMidnight: string;
    cpmBidMidnight: string;
    startTime: string;
    endTime: string;
    status: string;
  }): Promise<CampaignResponseDto> {
    const now = new Date();
    await this.prisma.campaign.create({
      data: {
        id: params.id,
        advertiserId: params.advertiserId,
        segmentId: params.segmentId,
        creativeId: params.creativeId,
        segmentCentroid: JSON.stringify(params.centroid),
        similarityThreshold: params.similarityThreshold,
        targetCategories: JSON.stringify(params.targetCategories),
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        clickUrl: params.clickUrl,
        advertiserName: params.advertiserName,
        budgetMidnight: params.budgetMidnight,
        cpmBidMidnight: params.cpmBidMidnight,
        startTime: new Date(params.startTime),
        endTime: new Date(params.endTime),
        status: params.status,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.findByIdOrThrow(params.id);
  }

  async listByAdvertiser(advertiserId: string): Promise<CampaignResponseDto[]> {
    const rows = await this.prisma.campaign.findMany({
      where: { advertiserId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: any) => this.mapRow(row));
  }

  async findById(id: string): Promise<CampaignResponseDto | null> {
    const row = await this.prisma.campaign.findUnique({ where: { id } });
    return row ? this.mapRow(row as any) : null;
  }

  async findByIdForAdvertiser(id: string, advertiserId: string): Promise<CampaignResponseDto | null> {
    const row = await this.prisma.campaign.findFirst({ where: { id, advertiserId } });
    return row ? this.mapRow(row as any) : null;
  }

  async listActive(): Promise<CampaignResponseDto[]> {
    const now = new Date();
    const rows = await this.prisma.campaign.findMany({
      where: { status: 'ACTIVE', startTime: { lte: now }, endTime: { gte: now } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row: any) => this.mapRow(row));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.campaign.update({ where: { id }, data: { status, updatedAt: new Date() } });
  }

  async recordMidnightTx(id: string, txHash: string): Promise<void> {
    await this.prisma.campaign.update({ where: { id }, data: { midnightTxHash: txHash, updatedAt: new Date() } });
  }

  private async findByIdOrThrow(id: string): Promise<CampaignResponseDto> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error(`Campaign ${id} was not persisted`);
    }
    return campaign;
  }

  private mapRow(row: CampaignRow): CampaignResponseDto {
    return {
      id: row.id,
      segment: {
        id: row.segmentId,
        centroid: JSON.parse(row.segmentCentroid) as number[],
        similarityThreshold: row.similarityThreshold,
        targetCategories: JSON.parse(row.targetCategories) as string[],
      },
      creative: {
        id: row.creativeId,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        clickUrl: row.clickUrl,
        advertiserName: row.advertiserName,
      },
      status: row.status,
      budgetMidnight: row.budgetMidnight,
      startTime: (row.startTime as Date).toISOString(),
      endTime: (row.endTime as Date).toISOString(),
    };
  }
}
