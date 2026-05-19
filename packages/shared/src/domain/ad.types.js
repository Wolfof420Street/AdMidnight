"use strict";
/**
 * Core domain types for the AdMidnight protocol.
 * These are pure TypeScript — no framework dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEREST_CATEGORIES = void 0;
exports.scaleToField = scaleToField;
const JUBJUB_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;
const EMBEDDING_SCALE = 1048576n;
function scaleToField(value) {
    const scaled = BigInt(Math.round(value * Number(EMBEDDING_SCALE)));
    return (((scaled % JUBJUB_ORDER) + JUBJUB_ORDER) %
        JUBJUB_ORDER);
}
exports.INTEREST_CATEGORIES = [
    'SPORTS',
    'TECH',
    'FINANCE',
    'HEALTH',
    'TRAVEL',
    'FASHION',
    'GAMING',
    'FOOD',
    'AUTO',
    'ENTERTAINMENT',
];
//# sourceMappingURL=ad.types.js.map