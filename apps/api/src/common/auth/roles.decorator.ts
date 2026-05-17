import { SetMetadata } from '@nestjs/common';
import type { JwtPrincipal } from './jwt-principal';

export const ROLE_METADATA_KEY = 'role';

export const Roles = (...roles: JwtPrincipal['role'][]) =>
  SetMetadata(ROLE_METADATA_KEY, roles);
