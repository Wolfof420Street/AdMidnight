import { Module } from '@nestjs/common';
import { AuctionEngine } from './auction.engine';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [AuctionEngine],
  exports: [AuctionEngine],
})
export class AuctionModule {}
