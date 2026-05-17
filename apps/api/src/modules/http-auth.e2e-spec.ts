import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { describe, expect, afterEach, beforeEach, it, vi } from 'vitest';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPrincipal } from '../common/auth/current-principal.decorator';
import type { JwtPrincipal } from '../common/auth/jwt-principal';
import { Roles } from '../common/auth/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import type { RevealBidRequestDto } from './advertiser/dto/reveal-bid.request.dto';
import type { ClaimRewardRequestDto } from './user/dto/claim-reward.request.dto';

const mockJwtService = {
  verifyAsync: vi.fn(),
};

const advertiserService = {
  revealAndSettle: vi.fn().mockResolvedValue({
    campaignId: 'campaign-1',
    winnerAdvertiserId: 'adv-1',
    impressionCount: 3,
    totalSpend: '9',
    settlementTxHash: '0xsettled',
    settledAt: '2026-05-15T10:00:00.000Z',
  }),
};

const userService = {
  claimReward: vi.fn().mockResolvedValue({
    txHash: '0xclaimed',
    amountMidnight: '1',
    status: 'CLAIMED',
  }),
};

@ApiTags('auction')
@ApiBearerAuth()
@Roles('advertiser')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('auction')
class AuctionTestController {
  @Post('settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle an advertiser auction with a revealed bid' })
  async settleAuction(
    @CurrentPrincipal() principal: JwtPrincipal,
    @Body() dto: RevealBidRequestDto,
  ) {
    return advertiserService.revealAndSettle(principal, dto);
  }
}

@ApiTags('user')
@Controller('user')
class UserTestController {
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim reward anonymously via nullifier' })
  async claimRewardAlias(@Body() dto: ClaimRewardRequestDto) {
    return userService.claimReward(dto);
  }
}

describe('HTTP auth fail-closed', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockJwtService.verifyAsync.mockReset();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuctionTestController, UserTestController],
      providers: [Reflector, { provide: JwtService, useValue: mockJwtService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new JwtAuthGuard(mockJwtService as never))
      .overrideGuard(RoleGuard)
      .useValue(new RoleGuard(new Reflector()))
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('fails closed on /auction/settle without a bearer token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auction/settle',
      payload: {
        campaignId: 'campaign-1',
        actualBid: '100',
        nonce: '0x' + 'a'.repeat(64),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Missing bearer token');
  });

  it('fails closed on /auction/settle with an invalid token', async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    const response = await app.inject({
      method: 'POST',
      url: '/auction/settle',
      headers: { Authorization: 'Bearer invalid-token' },
      payload: {
        campaignId: 'campaign-1',
        actualBid: '100',
        nonce: '0x' + 'a'.repeat(64),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
  });

  it('fails closed on /auction/settle when the JWT role is not advertiser', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'pub-1', role: 'publisher' });

    const response = await app.inject({
      method: 'POST',
      url: '/auction/settle',
      headers: { Authorization: 'Bearer valid-token' },
      payload: {
        campaignId: 'campaign-1',
        actualBid: '100',
        nonce: '0x' + 'a'.repeat(64),
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('allows /auction/settle for an authenticated advertiser', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'adv-1', role: 'advertiser' });

    const response = await app.inject({
      method: 'POST',
      url: '/auction/settle',
      headers: { Authorization: 'Bearer valid-token' },
      payload: {
        campaignId: 'campaign-1',
        actualBid: '100',
        nonce: '0x' + 'a'.repeat(64),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    expect(advertiserService.revealAndSettle).toHaveBeenCalledTimes(1);
  });

  it('fails closed on /user/claim without a bearer token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/user/claim',
      payload: {
        nullifier: '0x' + 'b'.repeat(64),
        zkProof: 'proof-bytes',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Missing bearer token');
  });

  it('allows /user/claim for an authenticated principal', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'publisher' });

    const response = await app.inject({
      method: 'POST',
      url: '/user/claim',
      headers: { Authorization: 'Bearer valid-token' },
      payload: {
        nullifier: '0x' + 'b'.repeat(64),
        zkProof: 'proof-bytes',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledTimes(1);
    expect(userService.claimReward).toHaveBeenCalledTimes(1);
  });
});
