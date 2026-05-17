export interface JwtPrincipal {
  readonly sub: string;
  readonly role: 'advertiser' | 'publisher' | 'internal';
  readonly iat?: number;
  readonly exp?: number;
}
