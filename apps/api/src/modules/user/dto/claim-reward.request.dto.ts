import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsBytes32 } from '@admidnight/shared';

export class ClaimRewardRequestDto {
  @ApiProperty()
  @IsBytes32()
  nullifier!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zkProof!: string;
}
