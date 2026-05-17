import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { buildAuthCookie, buildClearedAuthCookie } from '../../common/auth/auth-cookie';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login.request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Issue an HttpOnly advertiser session cookie' })
  @ApiResponse({ status: 200, description: 'Advertiser session issued' })
  async login(
    @Body() dto: LoginRequestDto,
    @Headers('x-client') clientType: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.authService.login(dto.email, dto.password);
    reply.header('Set-Cookie', buildAuthCookie(session.token));
    const response = {
      sub: session.principal.sub,
      role: session.principal.role,
      email: session.principal.email,
      name: session.principal.name,
      expiresAt: session.expiresAt,
    } as {
      sub: string;
      role: 'advertiser';
      email: string;
      name: string;
      expiresAt: string;
      token?: string;
    };

    if (clientType === 'mobile') {
      response.token = session.token;
    }

    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) reply: FastifyReply): Promise<{ cleared: true }> {
    reply.header('Set-Cookie', buildClearedAuthCookie());
    return { cleared: true };
  }
}