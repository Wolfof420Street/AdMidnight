import { Injectable } from '@nestjs/common';
import type { ProofCryptoService } from '../midnight/proof-crypto.service';
import type { ValidateProofRequestDto } from './dto/validate-proof.request.dto';

@Injectable()
export class InternalService {
  constructor(private readonly proofCrypto: ProofCryptoService) {}

  async validateProof(dto: ValidateProofRequestDto): Promise<{
    valid: boolean;
    publicOutputs: Record<string, unknown>;
  }> {
    const proof = {
      proofBytes: dto.proofBytes,
      publicInputs: dto.publicInputs as never,
      circuit: dto.circuit as never,
      generatedAt: new Date(dto.generatedAt),
    };

    this.proofCrypto.verifyAndBind(proof as any);
    const valid = true;
    return { valid, publicOutputs: dto.publicInputs };
  }
}
