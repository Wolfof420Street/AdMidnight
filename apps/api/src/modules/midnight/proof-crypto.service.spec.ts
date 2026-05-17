import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { ProofCryptoService } from './proof-crypto.service';

function buildProofBytes(overrides: Partial<{
  circuit: string;
  generatedAt: string;
  publicInputs: {
    segmentId: string;
    campaignId: string;
    isMatch: boolean;
    nullifier: string;
  };
}> = {}): string {
  const envelope = {
    circuit: overrides.circuit ?? 'proveSegmentMatch',
    generatedAt: overrides.generatedAt ?? '2026-05-15T10:00:00.000Z',
    publicInputs: overrides.publicInputs ?? {
      segmentId: '0x' + '1'.repeat(64),
      campaignId: '0x' + '2'.repeat(64),
      isMatch: true,
      nullifier: '0x' + '3'.repeat(64),
    },
  };

  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
}

describe('ProofCryptoService', () => {
  const service = new ProofCryptoService();

  it('binds a valid proof envelope to deterministic hashes', () => {
    const proofBytes = buildProofBytes();
    const proof = {
      proofBytes,
      circuit: 'proveSegmentMatch',
      generatedAt: new Date('2026-05-15T10:00:00.000Z'),
      publicInputs: {
        segmentId: '0x' + '1'.repeat(64),
        campaignId: '0x' + '2'.repeat(64),
        isMatch: true,
        nullifier: '0x' + '3'.repeat(64),
      },
    } as const;

    const result = service.verifyAndBind(proof);

    const publicInputHash = `0x${createHash('sha256')
      .update(JSON.stringify({ circuit: proof.circuit, publicInputs: proof.publicInputs }))
      .digest('hex')}`;
    const proofHash = `0x${createHash('sha256').update(proofBytes).digest('hex')}`;

    expect(result.publicInputHash).toBe(publicInputHash);
    expect(result.proofHash).toBe(proofHash);
    expect(result.commitmentHash).toBe(
      `0x${createHash('sha256').update(`${proof.circuit}:${publicInputHash}:${proofHash}`).digest('hex')}`,
    );
  });

  it('rejects malformed base64 proof bytes', () => {
    const proof = {
      proofBytes: 'not-base64',
      circuit: 'proveSegmentMatch',
      generatedAt: new Date('2026-05-15T10:00:00.000Z'),
      publicInputs: {
        segmentId: '0x' + '1'.repeat(64),
        campaignId: '0x' + '2'.repeat(64),
        isMatch: true,
        nullifier: '0x' + '3'.repeat(64),
      },
    } as const;

    expect(() => service.verifyAndBind(proof)).toThrow('Proof bytes must be valid base64');
  });

  it('rejects a proof whose envelope timestamp is invalid', () => {
    const proof = {
      proofBytes: buildProofBytes({ generatedAt: 'not-a-date' }),
      circuit: 'proveSegmentMatch',
      generatedAt: new Date('2026-05-15T10:00:00.000Z'),
      publicInputs: {
        segmentId: '0x' + '1'.repeat(64),
        campaignId: '0x' + '2'.repeat(64),
        isMatch: true,
        nullifier: '0x' + '3'.repeat(64),
      },
    } as const;

    expect(() => service.verifyAndBind(proof)).toThrow('Proof generatedAt must be a valid ISO date');
  });

  it('rejects a proof that is bound to a different nullifier', () => {
    const proofBytes = buildProofBytes();

    expect(() => service.createClaimCommitment(proofBytes, '0x' + '4'.repeat(64))).toThrow(
      'Claim proof nullifier mismatch',
    );
  });
});