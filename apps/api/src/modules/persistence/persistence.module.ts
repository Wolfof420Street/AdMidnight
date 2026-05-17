import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PersistenceBootstrapService } from './persistence-bootstrap.service';
import { AdvertiserRepository } from './repositories/advertiser.repository';
import { CampaignRepository } from './repositories/campaign.repository';
import { BidRepository } from './repositories/bid.repository';
import { ProofRepository } from './repositories/proof.repository';
import { RewardRepository } from './repositories/reward.repository';
import { PublisherRepository } from './repositories/publisher.repository';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PersistenceBootstrapService,
    AdvertiserRepository,
    CampaignRepository,
    BidRepository,
    ProofRepository,
    RewardRepository,
    PublisherRepository,
  ],
  exports: [
    AdvertiserRepository,
    CampaignRepository,
    BidRepository,
    ProofRepository,
    RewardRepository,
    PublisherRepository,
  ],
})
export class PersistenceModule {}
