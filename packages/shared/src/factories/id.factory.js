"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdFactory = void 0;
/**
 * IdFactory — domain ID generation.
 * SoC: ID generation is a domain concern, not a controller concern.
 * DRY: previously inline in AdvertiserService, replicated in campaign wizard.
 */
const crypto_1 = require("crypto");
class IdFactory {
    static newBytes32() {
        return '0x' + (0, crypto_1.randomBytes)(32).toString('hex');
    }
    static newCampaignId() {
        return this.newBytes32();
    }
    static newSegmentId() {
        return this.newBytes32();
    }
    static newNullifierPreimage() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
}
exports.IdFactory = IdFactory;
//# sourceMappingURL=id.factory.js.map