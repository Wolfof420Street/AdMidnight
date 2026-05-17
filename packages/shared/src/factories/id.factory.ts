/**
 * IdFactory — domain ID generation.
 * SoC: ID generation is a domain concern, not a controller concern.
 * DRY: previously inline in AdvertiserService, replicated in campaign wizard.
 */
import { randomBytes } from 'crypto';

export class IdFactory {
  static newBytes32(): string {
    return '0x' + randomBytes(32).toString('hex');
  }

  static newCampaignId(): string {
    return this.newBytes32();
  }

  static newSegmentId(): string {
    return this.newBytes32();
  }

  static newNullifierPreimage(): string {
    return randomBytes(32).toString('hex');
  }
}
