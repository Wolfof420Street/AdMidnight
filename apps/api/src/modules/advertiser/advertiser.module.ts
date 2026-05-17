import { Module } from '@nestjs/common';
import { AuctionModule } from '../auction/auction.module';
import { AuctionController } from './auction.controller';
import { AdvertiserController } from './advertiser.controller';
import { AdvertiserService } from './advertiser.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [AuctionModule, PersistenceModule],
  controllers: [AdvertiserController, AuctionController],
  providers: [AdvertiserService],
})
export class AdvertiserModule {}
