import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { PublisherController } from './publisher.controller';
import { PublisherService } from './publisher.service';

@Module({
  imports: [PersistenceModule],
  controllers: [PublisherController],
  providers: [PublisherService],
})
export class PublisherModule {}
