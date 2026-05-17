import { IsNotEmpty, IsString } from 'class-validator';
import { IsBytes32 } from '@admidnight/shared';

export class RegisterImpressionRequestDto {
  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @IsString()
  @IsNotEmpty()
  matchProofBytes!: string;

  @IsBytes32()
  matchProofNullifier!: string;
}
