import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  Injectable,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import type { JwtPrincipal } from '../auth/jwt-principal';
import { AUTH_COOKIE_NAME } from '../auth/auth-cookie';

function readCookieValue(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === cookieName) {
      return rest.join('=') || null;
    }
  }

  return null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPrincipal }>();
    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    const cookieToken = readCookieValue(request.headers.cookie, AUTH_COOKIE_NAME);
    const token = bearerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPrincipal>(token);
      if (!payload?.sub || !payload.role) {
        throw new UnauthorizedException('JWT payload missing required claims');
      }

      if (!['advertiser', 'publisher', 'internal'].includes(payload.role)) {
        throw new ForbiddenException('Unsupported principal role');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}
