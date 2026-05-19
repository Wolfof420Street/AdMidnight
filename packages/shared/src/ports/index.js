"use strict";
/**
 * Port interfaces — the boundary between domain and infrastructure.
 *
 * SOLID application:
 *   D — Domain services depend on these interfaces (DIP).
 *   I — Each interface is focused on one concern (ISP).
 *   O — New relay implementations extend without modifying callers (OCP).
 *
 * Nothing in this file imports from NestJS, Midnight SDK, Prisma, or Redis.
 * These are pure TypeScript interface definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asTxHash = asTxHash;
exports.asNullifier = asNullifier;
exports.asCampaignId = asCampaignId;
exports.asAdvertiserId = asAdvertiserId;
function asTxHash(s) {
    return s;
}
function asNullifier(s) {
    return s;
}
function asCampaignId(s) {
    return s;
}
function asAdvertiserId(s) {
    return s;
}
//# sourceMappingURL=index.js.map