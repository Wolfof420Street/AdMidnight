import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RoleGuard } from './common/guards/role.guard';
import { AuctionModule } from './modules/auction/auction.module';
import { AdvertiserModule } from './modules/advertiser/advertiser.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { InternalModule } from './modules/internal/internal.module';
import { MidnightModule } from './modules/midnight/midnight.module';
import { PersistenceModule } from './modules/persistence/persistence.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config: Record<string, unknown>) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'MIDNIGHT_PROOF_SERVER_URL',
          'MIDNIGHT_INDEXER_GRAPHQL_URL',
          'MIDNIGHT_INDEXER_WS_URL',
          'MIDNIGHT_PRIVATE_STATE_PASSWORD',
          'MATCH_REGISTRY_CONTRACT_ADDRESS',
          'AUCTION_CONTRACT_ADDRESS',
          'REWARD_CONTRACT_ADDRESS',
        ];
        const isProduction = config.NODE_ENV === 'production';
        for (const key of required) {
          if (!config[key]) {
            throw new Error(`Missing required env var: ${key}`);
          }
        }
        const jwtSecret = String(config.JWT_SECRET);
        if (
          jwtSecret.length < 32 ||
          jwtSecret === 'change_me_in_production_min_32_chars'
        ) {
          throw new Error('JWT_SECRET must be a strong non-default value of at least 32 characters');
        }
        if (isProduction && (!config.ADVERTISER_LOGIN_EMAIL || !config.ADVERTISER_LOGIN_PASSWORD)) {
          throw new Error('ADVERTISER_LOGIN_EMAIL and ADVERTISER_LOGIN_PASSWORD are required in production');
        }
        return config;
      },
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 200 },
    ]),
    PrismaModule,
    PersistenceModule,
    MidnightModule,
    HealthModule,
    AuctionModule,
    AuthModule,
    UserModule,
    AdvertiserModule,
    PublisherModule,
    InternalModule,
  ],
  providers: [RoleGuard, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
