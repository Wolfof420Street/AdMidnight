import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuctionResultResponseDto,
  CampaignResponseDto,
} from '@admidnight/shared';
import { CurrentPrincipal } from '../../common/auth/current-principal.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import type { JwtPrincipal } from '../../common/auth/jwt-principal';
import type { AdvertiserService } from './advertiser.service';
import type { CreateCampaignRequestDto } from './dto/create-campaign.request.dto';
import type { RevealBidRequestDto } from './dto/reveal-bid.request.dto';
import type { SealedBidRequestDto } from './dto/sealed-bid.request.dto';

@ApiTags('advertiser')
@ApiBearerAuth()
@Roles('advertiser')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('advertiser')
export class AdvertiserController {
  constructor(private readonly advertiserService: AdvertiserService) {}

  @Post('campaign/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new ad campaign with segment targeting' })
  async createCampaign(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Body() dto: CreateCampaignRequestDto,
  ): Promise<CampaignResponseDto> {
    return this.advertiserService.createCampaign(principal, dto);
  }

  @Get('campaign')
  @ApiOperation({ summary: 'List all campaigns for authenticated advertiser' })
  async listCampaigns(
    @CurrentPrincipal() principal: JwtPrincipal,
  ): Promise<CampaignResponseDto[]> {
    return this.advertiserService.listCampaigns(principal);
  }

  @Get('campaign/:id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics (aggregated ZK proofs, no user data)' })
  async getCampaignAnalytics(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Param('id') id: string,
  ): Promise<{
    impressions: number;
    estimatedCtr: number;
    totalSpend: string;
  }> {
    return this.advertiserService.getCampaignAnalytics(principal, id);
  }

  @Post('auction/bid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit sealed bid commitment (actual bid stays client-side)' })
  async submitSealedBid(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Body() dto: SealedBidRequestDto,
  ): Promise<{ txHash: string; bidReceiptId: string }> {
    return this.advertiserService.submitSealedBid(principal, dto);
  }

  @Post('auction/reveal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reveal bid and trigger ZK auction settlement' })
  async revealBid(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Body() dto: RevealBidRequestDto,
  ): Promise<AuctionResultResponseDto> {
    return this.advertiserService.revealAndSettle(principal, dto);
  }

  @Get('auction/:id/result')
  @ApiOperation({ summary: 'Get auction result for campaign' })
  async getAuctionResult(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Param('id') campaignId: string,
  ): Promise<AuctionResultResponseDto> {
    return this.advertiserService.getAuctionResult(principal, campaignId);
  }
}
