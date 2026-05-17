import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { JwtPrincipal } from '../auth/jwt-principal';
import { ROLE_METADATA_KEY } from '../auth/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<JwtPrincipal['role'][]>(
      ROLE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPrincipal }>();

    const role = request.user?.role;
    if (!role || !roles.includes(role)) {
      throw new ForbiddenException('Principal does not have access to this resource');
    }

    return true;
  }
}
