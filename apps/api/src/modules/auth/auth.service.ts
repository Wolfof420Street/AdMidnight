import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import type { JwtPrincipal } from '../../common/auth/jwt-principal';

interface LoginSession {
  token: string;
  principal: JwtPrincipal & { email: string; name: string };
  expiresAt: string;
}

@Injectable()
export class AuthService {
  private readonly loginEmail: string;
  private readonly loginPassword: string;
  private readonly loginName: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.loginEmail = configService.get<string>('ADVERTISER_LOGIN_EMAIL') ?? 'advertiser@admidnight.local';
    this.loginPassword = configService.get<string>('ADVERTISER_LOGIN_PASSWORD') ?? 'admidnight-demo';
    this.loginName = configService.get<string>('ADVERTISER_LOGIN_NAME') ?? 'AdMidnight Advertiser';

    if (isProduction && (!configService.get<string>('ADVERTISER_LOGIN_EMAIL') || !configService.get<string>('ADVERTISER_LOGIN_PASSWORD'))) {
      throw new Error('ADVERTISER_LOGIN_EMAIL and ADVERTISER_LOGIN_PASSWORD are required in production');
    }
  }

  async login(email: string, password: string): Promise<LoginSession> {
    if (!this.isValidCredential(email, password)) {
      throw new UnauthorizedException('Invalid advertiser credentials');
    }

    const principal: JwtPrincipal & { email: string; name: string } = {
      sub: email,
      role: 'advertiser',
      email,
      name: this.loginName,
    };

    const token = await this.jwtService.signAsync(principal);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return { token, principal, expiresAt };
  }

  private isValidCredential(email: string, password: string): boolean {
    const emailMatches = this.safeEquals(email, this.loginEmail);
    const passwordMatches = this.safeEquals(password, this.loginPassword);
    return emailMatches && passwordMatches;
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}