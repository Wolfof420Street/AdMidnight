// CRITICAL: setNetworkId must be called before any Midnight SDK import resolves.
import { initMidnightNetwork } from '@admidnight/midnight-sdk-wrapper';

const networkId = (process.env.MIDNIGHT_NETWORK_ID ?? 'undeployed') as
  | 'undeployed'
  | 'devnet'
  | 'testnet'
  | 'mainnet';
initMidnightNetwork(networkId);

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

function parseOrigins(rawOrigins: string, isProduction: boolean): string[] {
  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && origins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must be set in production');
  }

  if (!isProduction && origins.length === 0) {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  return origins;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.proofBytes',
            'req.body.zkProof',
            'req.body.matchProofBytes',
            'req.body.publicInputs.nullifier',
            'req.body.publicInputs.segmentId',
            'req.body.publicInputs.campaignId',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 3001);
  const prefix = config.get<string>('API_PREFIX', '/api/v1');
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const allowedOrigins = parseOrigins(
    config.get<string>('ALLOWED_ORIGINS', ''),
    isProduction,
  );

  app.setGlobalPrefix(prefix);
  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
    credentials: true,
  });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onSend', async (request, reply, payload) => {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(header, value);
    }

    if (isProduction) {
      reply.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }

    const requestId = request.headers['x-request-id'];
    if (typeof requestId === 'string' && requestId.length > 0) {
      reply.header('X-Request-Id', requestId);
    }

    return payload;
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AdMidnight Protocol API')
    .setDescription('Privacy-preserving Ad-Tech on Midnight Blockchain')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health')
    .addTag('user')
    .addTag('advertiser')
    .addTag('publisher')
    .addTag('internal')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.info(`[AdMidnight API] Running on port ${port}`);
}

bootstrap().catch(console.error);

