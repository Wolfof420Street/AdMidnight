import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBytes32 } from '@admidnight/shared';

class PublicInputsDto {
  @ApiProperty()
  @IsBytes32()
  segmentId!: string;

  @ApiProperty()
  @IsBytes32()
  campaignId!: string;

  @ApiProperty()
  @IsBoolean()
  isMatch!: boolean;

  @ApiProperty()
  @IsBytes32()
  nullifier!: string;
}

export class SubmitMatchProofRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  proofBytes!: string;

  @ApiProperty({ type: PublicInputsDto })
  @ValidateNested()
  @Type(() => PublicInputsDto)
  publicInputs!: PublicInputsDto;

  @ApiProperty()
  @IsDateString()
  generatedAt!: string;
}
