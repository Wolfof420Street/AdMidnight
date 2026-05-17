import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { ZKProof } from '@admidnight/shared';

type ProofEnvelope = {
  circuit: string;
  generatedAt: string;
  publicInputs: {
    segmentId: string;
    campaignId: string;
    isMatch: boolean;
    nullifier: string;
  };
};

@Injectable()
export class ProofCryptoService {
  verifyAndBind(proof: ZKProof): {
    proofHash: string;
    publicInputHash: string;
    commitmentHash: string;
  } {
    const envelope = this.parseEnvelope(proof.proofBytes);
    const envelopeGeneratedAt = this.parseIsoDate(envelope.generatedAt, 'Proof generatedAt');

    if (envelope.circuit !== proof.circuit) {
      throw new BadRequestException('Proof circuit mismatch');
    }

    if (envelopeGeneratedAt.toISOString() !== proof.generatedAt.toISOString()) {
      throw new BadRequestException('Proof timestamp mismatch');
    }

    if (
      envelope.publicInputs.segmentId !== proof.publicInputs.segmentId ||
      envelope.publicInputs.campaignId !== proof.publicInputs.campaignId ||
      envelope.publicInputs.nullifier !== proof.publicInputs.nullifier ||
      envelope.publicInputs.isMatch !== proof.publicInputs.isMatch
    ) {
      throw new BadRequestException('Proof public inputs do not match request payload');
    }

    const publicInputHash = this.sha256Hex(
      JSON.stringify({
        circuit: proof.circuit,
        publicInputs: proof.publicInputs,
      }),
    );

    const proofHash = this.sha256Hex(proof.proofBytes);
    const commitmentHash = this.sha256Hex(
      `${proof.circuit}:${publicInputHash}:${proofHash}`,
    );

    return { proofHash, publicInputHash, commitmentHash };
  }

  createClaimCommitment(proofBytes: string, nullifier: string): string {
    const envelope = this.parseEnvelope(proofBytes);
    if (envelope.publicInputs.nullifier !== nullifier) {
      throw new BadRequestException('Claim proof nullifier mismatch');
    }
    return this.sha256Hex(`${nullifier}:${proofBytes}`);
  }

  private parseEnvelope(proofBytes: string): ProofEnvelope {
    if (!this.isStrictBase64(proofBytes)) {
      throw new BadRequestException('Proof bytes must be valid base64');
    }

    const decoded = Buffer.from(proofBytes, 'base64').toString('utf8');

    let envelope: unknown;
    try {
      envelope = JSON.parse(decoded) as unknown;
    } catch {
      throw new BadRequestException('Proof bytes must decode to a valid JSON proof envelope');
    }

    if (
      !envelope ||
      typeof envelope !== 'object' ||
      typeof (envelope as ProofEnvelope).circuit !== 'string' ||
      typeof (envelope as ProofEnvelope).generatedAt !== 'string' ||
      typeof (envelope as ProofEnvelope).publicInputs?.segmentId !== 'string' ||
      typeof (envelope as ProofEnvelope).publicInputs?.campaignId !== 'string' ||
      typeof (envelope as ProofEnvelope).publicInputs?.nullifier !== 'string' ||
      typeof (envelope as ProofEnvelope).publicInputs?.isMatch !== 'boolean'
    ) {
      throw new BadRequestException('Invalid proof envelope shape');
    }

    return envelope as ProofEnvelope;
  }

  private isStrictBase64(input: string): boolean {
    const normalized = input.replace(/\s+/g, '');
    if (!normalized || normalized.length % 4 !== 0) {
      return false;
    }

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
      return false;
    }

    const decoded = Buffer.from(normalized, 'base64');
    return decoded.toString('base64') === normalized;
  }

  private parseIsoDate(value: string, label: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} must be a valid ISO date`);
    }
    return date;
  }

  private sha256Hex(input: string): string {
    return `0x${createHash('sha256').update(input).digest('hex')}`;
  }
}
