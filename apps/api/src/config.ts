/**
 * API Environment Configuration with Zod Validation
 * All environment variables validated here; app refuses to start if required vars missing
 * This is the ONLY place in the codebase that reads process.env
 */
import { z } from 'zod';

const ConfigSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('7d'),

  // Midnight Network
  MIDNIGHT_NODE_URL: z.string().url('MIDNIGHT_NODE_URL must be a valid WebSocket URL'),
  PROOF_SERVER_URL: z.string().url('PROOF_SERVER_URL must be a valid HTTP URL'),
  INDEXER_URL: z.string().url('INDEXER_URL must be a valid HTTP URL'),
  INDEXER_WS_URL: z.string().url('INDEXER_WS_URL must be a valid WebSocket URL'),

  // Contract Addresses
  CONTRACT_ADDRESS_MATCH_REGISTRY: z.string().startsWith('0x', 'Must be hex address'),
  CONTRACT_ADDRESS_AUCTION: z.string().startsWith('0x', 'Must be hex address'),
  CONTRACT_ADDRESS_REWARD: z.string().startsWith('0x', 'Must be hex address'),

  // API
  API_PORT: z.string().default('3001').transform(Number).pipe(z.number().min(1024).max(65535)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),

  // Optional: Redis (for caching/sessions)
  REDIS_URL: z.string().optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration
 * Throws error if required env vars are missing or invalid
 */
function loadConfig(): AppConfig {
  const result = ConfigSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.errors.forEach((error) => {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    });
    throw new Error('Invalid environment configuration. See errors above.');
  }

  return result.data;
}

// Load once at module import time
const config = loadConfig();

export default config;
