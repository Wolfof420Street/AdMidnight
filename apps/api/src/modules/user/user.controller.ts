import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type {
  CampaignResponseDto,
  ProofVerificationResponseDto,
  RewardClaimResponseDto,
} from '@admidnight/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { ClaimRewardRequestDto } from './dto/claim-reward.request.dto';
import type { SubmitMatchProofRequestDto } from './dto/submit-match-proof.request.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('proof/match')
  @HttpCode(HttpStatus.OK)
  @Throttle({ medium: { limit: 50, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit ZK proof of ad match (no raw user data)' })
  @ApiResponse({ status: 200, description: 'Proof verified and reward escrowed' })
  async submitMatchProof(
    @Body() dto: SubmitMatchProofRequestDto,
  ): Promise<ProofVerificationResponseDto> {
    return this.userService.processMatchProof(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: 1000 } })
  @ApiOperation({ summary: 'Claim reward anonymously via nullifier' })
  async claimRewardAlias(
    @Body() dto: ClaimRewardRequestDto,
  ): Promise<RewardClaimResponseDto> {
    return this.userService.claimReward(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('rewards/claim')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 2, ttl: 1000 } })
  @ApiOperation({ summary: 'Claim reward anonymously via nullifier' })
  async claimReward(
    @Body() dto: ClaimRewardRequestDto,
  ): Promise<RewardClaimResponseDto> {
    return this.userService.claimReward(dto);
  }

  @Get('rewards/pending')
  @ApiOperation({ summary: 'List pending anonymous rewards by nullifier' })
  async getPendingRewards(): Promise<Array<{
    nullifier: string;
    amount: string;
    campaignId: string;
    escrowedTimestamp: string;
  }>> {
    return this.userService.getPendingRewards();
  }

  @Get('segments/available')
  @ApiOperation({ summary: 'Get public segment definitions for on-device matching' })
  async getAvailableSegments(): Promise<CampaignResponseDto[]> {
    return this.userService.getAvailableSegments();
  }
}
