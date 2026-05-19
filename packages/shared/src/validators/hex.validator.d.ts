/**
 * Reusable validation decorators and utilities for hex-encoded types.
 * DRY: one definition, used in all DTOs that need Bytes32 validation.
 */
import { type ValidationOptions } from 'class-validator';
export declare const BYTES32_REGEX: RegExp;
export declare const BYTES64_REGEX: RegExp;
export declare function IsBytes32(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
export declare function isValidBytes32(value: unknown): value is string;
export declare function deriveNullifier(segmentId: string, campaignId: string, salt: string): string;
//# sourceMappingURL=hex.validator.d.ts.map