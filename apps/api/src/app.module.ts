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
import { validateConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
      validate: validateConfig,
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
