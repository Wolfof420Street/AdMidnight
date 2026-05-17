import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsBytes32 } from '@admidnight/shared';

export class RevealBidRequestDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'actualBid must be a base-10 integer string' })
  actualBid!: string;

  @IsBytes32()
  nonce!: string;
}
