import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsBytes32 } from '@admidnight/shared';

export class SealedBidRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campaignId!: string;

  @ApiProperty()
  @IsBytes32()
  commitmentHash!: string;
}
