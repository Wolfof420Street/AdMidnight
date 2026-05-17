import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { AuctionResultResponseDto } from '@admidnight/shared';
import type { MidnightGateway } from '../midnight/midnight.gateway';
import type { BidRepository } from '../persistence/repositories/bid.repository';
import type { ProofRepository } from '../persistence/repositories/proof.repository';
import type { RevealBidRequestDto } from '../advertiser/dto/reveal-bid.request.dto';
import { SecondPriceStrategy } from './strategies/second-price.strategy';

@Injectable()
export class AuctionEngine {
  private readonly logger = new Logger(AuctionEngine.name);
  private readonly strategy = new SecondPriceStrategy();
  private readonly results = new Map<string, AuctionResultResponseDto>();

  constructor(
    private readonly midnightGateway: MidnightGateway,
    private readonly bidRepository: BidRepository,
    private readonly proofRepository: ProofRepository,
  ) {}

  verifyCommitmentOpening(
    actualBid: string,
    nonce: string,
    storedCommitment: string,
  ): boolean {
    const bidBytes = Buffer.from(actualBid, 'utf8');
    const nonceBytes = Buffer.from(nonce.replace(/^0x/, ''), 'hex');
    const recomputedHash =
      '0x' + createHash('sha256').update(Buffer.concat([bidBytes, nonceBytes])).digest('hex');
    return recomputedHash === storedCommitment;
  }

  async settleAuction(
    campaignId: string,
    winnerId: string,
    dto: RevealBidRequestDto,
  ): Promise<AuctionResultResponseDto> {
    const storedCommitment = await this.bidRepository.getCommitment(winnerId, campaignId);

    if (!storedCommitment) {
      throw new BadRequestException('No bid found for this advertiser/campaign');
    }

    if (!this.verifyCommitmentOpening(dto.actualBid, dto.nonce, storedCommitment)) {
      throw new BadRequestException('Bid commitment verification failed');
    }

    await this.bidRepository.revealBid({
      advertiserId: winnerId,
      campaignId,
      actualBid: dto.actualBid,
      nonce: dto.nonce,
    });

    const revealedBids = await this.bidRepository.listRevealedBids(campaignId);
    const { winnerId: actualWinner, priceToPay } =
      this.strategy.determineWinner(revealedBids as Parameters<
        SecondPriceStrategy['determineWinner']
      >[0]);

    if (actualWinner !== winnerId) {
      throw new BadRequestException('Revealed bid is valid but is not currently the auction winner');
    }

    const impressionProofNullifier = `0x${createHash('sha256')
      .update(`${campaignId}:${winnerId}:${dto.actualBid}`)
      .digest('hex')}`;

    const txHash = await this.midnightGateway.settleAuction({
      campaignId,
      winnerId,
      priceToPay: priceToPay.toString(),
      impressionProofNullifier,
    });

    const result: AuctionResultResponseDto = {
      campaignId,
      winnerAdvertiserId: winnerId,
      impressionCount: await this.proofRepository.getImpressionCount(campaignId),
      totalSpend: priceToPay.toString(),
      settlementTxHash: txHash,
      settledAt: new Date().toISOString(),
    };

    await this.bidRepository.markRevealed(winnerId, campaignId, true);
    await this.bidRepository.purgeLosingBids(campaignId, winnerId);
    this.results.set(campaignId, result);

    this.logger.log(`Auction settled for campaign ${campaignId}`);
    return result;
  }

  getAuctionResult(campaignId: string): AuctionResultResponseDto {
    const result = this.results.get(campaignId);
    if (!result) {
      throw new NotFoundException('Auction result not found');
    }
    return result;
  }
}
