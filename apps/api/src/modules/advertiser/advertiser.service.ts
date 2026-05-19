import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type {
  AuctionResultResponseDto,
  CampaignDetailResponseDto,
  CampaignResponseDto,
} from '@admidnight/shared';
import { IdFactory } from '@admidnight/shared';
import { AuctionEngine } from '../auction/auction.engine';
import type { JwtPrincipal } from '../../common/auth/jwt-principal';
import { MidnightGateway } from '../midnight/midnight.gateway';
import { AdvertiserRepository } from '../persistence/repositories/advertiser.repository';
import { BidRepository } from '../persistence/repositories/bid.repository';
import { CampaignRepository } from '../persistence/repositories/campaign.repository';
import { ProofRepository } from '../persistence/repositories/proof.repository';
import type { CreateCampaignRequestDto } from './dto/create-campaign.request.dto';
import type { RevealBidRequestDto } from './dto/reveal-bid.request.dto';
import type { SealedBidRequestDto } from './dto/sealed-bid.request.dto';

@Injectable()
export class AdvertiserService {
  private readonly logger = new Logger(AdvertiserService.name);

  constructor(
    private readonly advertiserRepository: AdvertiserRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly bidRepository: BidRepository,
    private readonly proofRepository: ProofRepository,
    private readonly midnightGateway: MidnightGateway,
    private readonly auctionEngine: AuctionEngine,
  ) {}

  async createCampaign(
    principal: JwtPrincipal,
    dto: CreateCampaignRequestDto,
  ): Promise<CampaignResponseDto> {
    this.assertAdvertiserPrincipal(principal);
    await this.advertiserRepository.ensureAdvertiser(
      principal.sub,
      dto.creative.advertiserName,
    );

    const campaignId = IdFactory.newCampaignId();
    const segmentId = IdFactory.newSegmentId();
    const creativeId = IdFactory.newBytes32();
    const segmentCommitment = `0x${createHash('sha256')
      .update(JSON.stringify({
        centroid: dto.segmentConfig.centroid,
        threshold: dto.segmentConfig.similarityThreshold,
        categories: dto.segmentConfig.targetCategories,
      }))
      .digest('hex')}`;

    await this.campaignRepository.create({
      id: campaignId,
      advertiserId: principal.sub,
      segmentId,
      creativeId,
      centroid: dto.segmentConfig.centroid,
      similarityThreshold: dto.segmentConfig.similarityThreshold,
      targetCategories: dto.segmentConfig.targetCategories,
      title: dto.creative.title,
      description: dto.creative.description,
      imageUrl: dto.creative.imageUrl,
      clickUrl: dto.creative.clickUrl,
      advertiserName: dto.creative.advertiserName,
      budgetMidnight: dto.budgetMidnight,
      cpmBidMidnight: dto.cpmBidMidnight,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: 'DRAFT',
    });

    const txHash = await this.midnightGateway.registerSegment({
      segmentId,
      campaignId,
      similarityThreshold: dto.segmentConfig.similarityThreshold,
      segmentCommitment,
    });

    await this.campaignRepository.recordMidnightTx(campaignId, txHash);
    await this.campaignRepository.updateStatus(campaignId, 'ACTIVE');
    this.logger.log(`Campaign created and registered: ${campaignId}`);
    return (await this.campaignRepository.findByIdForAdvertiser(
      campaignId,
      principal.sub,
    )) as CampaignResponseDto;
  }

  async listCampaigns(principal: JwtPrincipal): Promise<CampaignResponseDto[]> {
    this.assertAdvertiserPrincipal(principal);
    return this.campaignRepository.listByAdvertiser(principal.sub);
  }

  async getCampaign(
    principal: JwtPrincipal,
    campaignId: string,
  ): Promise<CampaignDetailResponseDto> {
    this.assertAdvertiserPrincipal(principal);
    const campaign = await this.campaignRepository.findByIdForAdvertiser(
      campaignId,
      principal.sub,
    );

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const settledResult = this.auctionEngine.tryGetAuctionResult(campaignId);
    if (settledResult) {
      return {
        ...campaign,
        auctionStatus: 'SETTLED',
        winnerAdvertiserId: settledResult.winnerAdvertiserId,
        settlementTxHash: settledResult.settlementTxHash,
      };
    }

    const existingCommitment = await this.bidRepository.getCommitment(
      principal.sub,
      campaignId,
    );

    return {
      ...campaign,
      auctionStatus: existingCommitment ? 'CLOSED' : 'OPEN',
    };
  }

  async getCampaignAnalytics(
    principal: JwtPrincipal,
    campaignId: string,
  ): Promise<{
    impressions: number;
    estimatedCtr: number;
    totalSpend: string;
  }> {
    await this.requireOwnedCampaign(principal, campaignId);
    const impressions = await this.proofRepository.getImpressionCount(campaignId);
    return {
      impressions,
      estimatedCtr: impressions > 0 ? 0.02 : 0,
      totalSpend: '0',
    };
  }

  async submitSealedBid(
    principal: JwtPrincipal,
    dto: SealedBidRequestDto,
  ): Promise<{
    txHash: string;
    bidReceiptId: string;
  }> {
    await this.requireOwnedCampaign(principal, dto.campaignId);
    const existing = await this.bidRepository.getCommitment(
      principal.sub,
      dto.campaignId,
    );
    if (existing) {
      throw new ConflictException('Bid already submitted for this campaign');
    }

    const txHash = await this.midnightGateway.commitBid(
      principal.sub,
      dto.campaignId,
      dto.commitmentHash,
    );

    await this.bidRepository.saveCommitment({
      advertiserId: principal.sub,
      campaignId: dto.campaignId,
      commitmentHash: dto.commitmentHash,
    });

    return { txHash, bidReceiptId: randomUUID() };
  }

  async revealAndSettle(
    principal: JwtPrincipal,
    dto: RevealBidRequestDto,
  ): Promise<AuctionResultResponseDto> {
    await this.requireOwnedCampaign(principal, dto.campaignId);
    return this.auctionEngine.settleAuction(dto.campaignId, principal.sub, dto);
  }

  async getAuctionResult(
    principal: JwtPrincipal,
    campaignId: string,
  ): Promise<AuctionResultResponseDto> {
    await this.requireOwnedCampaign(principal, campaignId);
    return this.auctionEngine.getAuctionResult(campaignId);
  }

  private assertAdvertiserPrincipal(principal: JwtPrincipal): void {
    if (principal.role !== 'advertiser' || !principal.sub) {
      throw new UnauthorizedException('Advertiser principal required');
    }
  }

  private async requireOwnedCampaign(
    principal: JwtPrincipal,
    campaignId: string,
  ): Promise<void> {
    this.assertAdvertiserPrincipal(principal);
    const campaign = await this.campaignRepository.findByIdForAdvertiser(
      campaignId,
      principal.sub,
    );
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
  }
}
