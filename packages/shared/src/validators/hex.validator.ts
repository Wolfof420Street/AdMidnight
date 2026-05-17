/**
 * Reusable validation decorators and utilities for hex-encoded types.
 * DRY: one definition, used in all DTOs that need Bytes32 validation.
 */
import { registerDecorator, type ValidationOptions } from 'class-validator';

export const BYTES32_REGEX = /^0x[0-9a-fA-F]{64}$/;
export const BYTES64_REGEX = /^0x[0-9a-fA-F]{128}$/;

export function IsBytes32(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isBytes32',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      constraints: [],
      options: {
        message: `${propertyName} must be a valid 0x-prefixed 32-byte hex string`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && BYTES32_REGEX.test(value);
        },
      },
    });
  };
}

export function isValidBytes32(value: unknown): value is string {
  return typeof value === 'string' && BYTES32_REGEX.test(value);
}

export function deriveNullifier(segmentId: string, campaignId: string, salt: string): string {
  const { createHash } = require('crypto') as typeof import('crypto');
  return '0x' + createHash('sha256')
    .update(`${segmentId}:${campaignId}:${salt}`)
    .digest('hex');
}
