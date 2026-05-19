"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BYTES64_REGEX = exports.BYTES32_REGEX = void 0;
exports.IsBytes32 = IsBytes32;
exports.isValidBytes32 = isValidBytes32;
exports.deriveNullifier = deriveNullifier;
/**
 * Reusable validation decorators and utilities for hex-encoded types.
 * DRY: one definition, used in all DTOs that need Bytes32 validation.
 */
const class_validator_1 = require("class-validator");
exports.BYTES32_REGEX = /^0x[0-9a-fA-F]{64}$/;
exports.BYTES64_REGEX = /^0x[0-9a-fA-F]{128}$/;
function IsBytes32(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isBytes32',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: {
                message: `${propertyName} must be a valid 0x-prefixed 32-byte hex string`,
                ...validationOptions,
            },
            validator: {
                validate(value) {
                    return typeof value === 'string' && exports.BYTES32_REGEX.test(value);
                },
            },
        });
    };
}
function isValidBytes32(value) {
    return typeof value === 'string' && exports.BYTES32_REGEX.test(value);
}
function deriveNullifier(segmentId, campaignId, salt) {
    const { createHash } = require('crypto');
    return '0x' + createHash('sha256')
        .update(`${segmentId}:${campaignId}:${salt}`)
        .digest('hex');
}
//# sourceMappingURL=hex.validator.js.map