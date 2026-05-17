import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { INTEREST_CATEGORIES } from '@admidnight/shared';

class SegmentConfigDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  centroid!: number[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold!: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsEnum(INTEREST_CATEGORIES, { each: true })
  @IsString({ each: true })
  targetCategories!: string[];
}

class AdCreativeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsUrl({ require_protocol: true })
  imageUrl!: string;

  @ApiProperty()
  @IsString()
  @IsUrl({ require_protocol: true })
  clickUrl!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  advertiserName!: string;
}

export class CreateCampaignRequestDto {
  @ValidateNested()
  @Type(() => SegmentConfigDto)
  segmentConfig!: SegmentConfigDto;

  @ValidateNested()
  @Type(() => AdCreativeDto)
  creative!: AdCreativeDto;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'budgetMidnight must be a base-10 integer string' })
  budgetMidnight!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'cpmBidMidnight must be a base-10 integer string' })
  cpmBidMidnight!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}
