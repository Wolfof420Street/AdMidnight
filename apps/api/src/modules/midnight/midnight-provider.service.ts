/**
 * MidnightProviderService — ONE responsibility: manage the Midnight provider lifecycle.
 *
 * SRP: This service only builds providers and tracks connection state.
 *      It does NOT relay proofs, submit bids, or query the indexer.
 * DIP: Other services that need providers inject this service.
 */
import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMidnightProviders,
  type BackendProviders,
  type MidnightNetworkId,
} from '@admidnight/midnight-sdk-wrapper';
import { resolve } from 'path';

@Injectable()
export class MidnightProviderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MidnightProviderService.name);
  private providers: BackendProviders | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.isDevMode()) {
      this.logger.warn('MIDNIGHT_DEV_MODE enabled; skipping Midnight provider initialisation');
      return;
    }

    const password = this.config.getOrThrow<string>('MIDNIGHT_PRIVATE_STATE_PASSWORD');
    if (password.length < 16) {
      throw new Error('MIDNIGHT_PRIVATE_STATE_PASSWORD must be ≥16 characters');
    }

    this.providers = await buildMidnightProviders({
      networkId: this.config.get(
        'MIDNIGHT_NETWORK_ID',
        'undeployed',
      ) as MidnightNetworkId,
      indexerGraphQlUrl: this.config.getOrThrow('MIDNIGHT_INDEXER_GRAPHQL_URL'),
      indexerWsUrl: this.config.getOrThrow('MIDNIGHT_INDEXER_WS_URL'),
      proofServerUrl: this.config.getOrThrow('MIDNIGHT_PROOF_SERVER_URL'),
      zkArtifactsDir: resolve(
        this.config.get('MIDNIGHT_ZK_ARTIFACTS_DIR', '../../packages/zk-circuits/managed'),
      ),
      privateStateStoreName: this.config.get('MIDNIGHT_PRIVATE_STATE_STORE', 'admidnight-api'),
      privateStatePassword: password,
      accountId: 'admidnight-api-node',
    });

    this.logger.log('Midnight providers initialised');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Midnight providers disconnecting');
  }

  getProviders(): BackendProviders {
    if (!this.providers) throw new Error('Providers not yet initialised');
    return this.providers;
  }

  isConnected(): boolean {
    return this.providers !== null;
  }

  isDevMode(): boolean {
    const raw = this.config.get<string | boolean>('MIDNIGHT_DEV_MODE');
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (typeof raw === 'string') {
      return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
    }
    return this.config.get<string>('NODE_ENV', 'development') !== 'production';
  }
}
