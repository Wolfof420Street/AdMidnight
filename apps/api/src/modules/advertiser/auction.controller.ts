import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuctionResultResponseDto } from '@admidnight/shared';
import { CurrentPrincipal } from '../../common/auth/current-principal.decorator';
import type { JwtPrincipal } from '../../common/auth/jwt-principal';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import type { RevealBidRequestDto } from './dto/reveal-bid.request.dto';
import { AdvertiserService } from './advertiser.service';

@ApiTags('auction')
@ApiBearerAuth()
@Roles('advertiser')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('auction')
export class AuctionController {
  constructor(private readonly advertiserService: AdvertiserService) {}

  @Post('settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle an advertiser auction with a revealed bid' })
  async settleAuction(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Body() dto: RevealBidRequestDto,
  ): Promise<AuctionResultResponseDto> {
    return this.advertiserService.revealAndSettle(principal, dto);
  }
}