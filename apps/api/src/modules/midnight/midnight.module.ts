import { Global, Module } from '@nestjs/common';
import { MidnightProviderService } from './midnight-provider.service.js';
import { IndexerQueryService } from './indexer-query.service.js';
import { DomainEventBus } from '../events/domain-event.bus.js';
import { MidnightGateway } from './midnight.gateway';
import { ProofCryptoService } from './proof-crypto.service';

@Global()
@Module({
  providers: [
    MidnightProviderService,
    IndexerQueryService,
    DomainEventBus,
    MidnightGateway,
    ProofCryptoService,
  ],
  exports: [
    MidnightProviderService,
    IndexerQueryService,
    DomainEventBus,
    MidnightGateway,
    ProofCryptoService,
  ],
})
export class MidnightModule {}
