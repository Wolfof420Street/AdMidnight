import {
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { JwtPrincipal } from './jwt-principal';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPrincipal => {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPrincipal }>();

    if (!request.user) {
      throw new UnauthorizedException('Authenticated principal missing from request');
    }

    return request.user;
  },
);
