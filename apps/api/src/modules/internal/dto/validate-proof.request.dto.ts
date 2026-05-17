import { IsDateString, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { CONTRACT_CIRCUITS } from '@admidnight/shared';
import { IsIn } from 'class-validator';

export class ValidateProofRequestDto {
  @IsString()
  @IsNotEmpty()
  proofBytes!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(CONTRACT_CIRCUITS))
  circuit!: string;

  @IsObject()
  publicInputs!: Record<string, unknown>;

  @IsDateString()
  generatedAt!: string;
}
