import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import type { ValidateProofRequestDto } from './dto/validate-proof.request.dto';
import { InternalService } from './internal.service';

@ApiTags('internal')
@Roles('internal')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post('proof/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a ZK proof without submitting to ledger' })
  async validateProof(
    @Body() dto: ValidateProofRequestDto,
  ): Promise<{ valid: boolean; publicOutputs: Record<string, unknown> }> {
    return this.internalService.validateProof(dto);
  }
}
