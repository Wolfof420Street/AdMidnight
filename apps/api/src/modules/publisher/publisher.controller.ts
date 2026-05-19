import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import type { RegisterImpressionRequestDto } from './dto/register-impression.request.dto';
import { PublisherService } from './publisher.service';

@ApiTags('publisher')
@Roles('publisher')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('impression/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a served impression backed by a valid match proof' })
  async registerImpression(
    @Body() dto: RegisterImpressionRequestDto,
  ): Promise<{ auctionId: string; estimatedPayout: string }> {
    return this.publisherService.registerImpression(dto);
  }

  @Get('revenue/dashboard')
  @ApiOperation({ summary: 'Publisher revenue summary (aggregated — no user data)' })
  async getRevenueDashboard(): Promise<{
    totalEarned: string;
    pendingSettlement: string;
    impressionCount: number;
  }> {
    return this.publisherService.getRevenueDashboard();
  }
}
