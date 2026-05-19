export type AppConfig = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  API_PREFIX: string;
  API_PORT?: number;
  PORT?: number;
  ALLOWED_ORIGINS: string;
  CORS_ORIGIN: string;
  ADVERTISER_LOGIN_EMAIL?: string;
  ADVERTISER_LOGIN_PASSWORD?: string;
  ADVERTISER_LOGIN_NAME?: string;
  MIDNIGHT_DEV_MODE: boolean;
  MIDNIGHT_NETWORK_ID: 'undeployed' | 'devnet' | 'testnet' | 'mainnet';
  MIDNIGHT_PRIVATE_STATE_PASSWORD?: string;
  MIDNIGHT_PROOF_SERVER_URL?: string;
  MIDNIGHT_INDEXER_GRAPHQL_URL?: string;
  MIDNIGHT_INDEXER_WS_URL?: string;
  MATCH_REGISTRY_CONTRACT_ADDRESS?: string;
  AUCTION_CONTRACT_ADDRESS?: string;
  REWARD_CONTRACT_ADDRESS?: string;
  MIDNIGHT_ZK_ARTIFACTS_DIR?: string;
  MIDNIGHT_PRIVATE_STATE_STORE?: string;
};

const NODE_ENVS = new Set<AppConfig['NODE_ENV']>([
  'development',
  'production',
  'test',
]);
const LOG_LEVELS = new Set<AppConfig['LOG_LEVEL']>([
  'error',
  'warn',
  'info',
  'debug',
]);
const NETWORK_IDS = new Set<AppConfig['MIDNIGHT_NETWORK_ID']>([
  'undeployed',
  'devnet',
  'testnet',
  'mainnet',
]);

function asString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asPort(config: Record<string, unknown>, key: 'API_PORT' | 'PORT'): number | undefined {
  const raw = asString(config, key);
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535`);
  }

  return value;
}

function asBoolean(config: Record<string, unknown>, key: string): boolean {
  const raw = asString(config, key);
  if (!raw) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function requireString(config: Record<string, unknown>, key: string): string {
  const value = asString(config, key);
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function ensureUrl(value: string | undefined, key: string): void {
  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
}

function ensureEmail(value: string | undefined, key: string): void {
  if (!value) {
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`${key} must be a valid email address`);
  }
}

function ensureStartsWithHex(value: string | undefined, key: string): void {
  if (value && !value.startsWith('0x')) {
    throw new Error(`${key} must start with 0x`);
  }
}

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const nodeEnv = (asString(config, 'NODE_ENV') ?? 'development') as AppConfig['NODE_ENV'];
  if (!NODE_ENVS.has(nodeEnv)) {
    throw new Error('NODE_ENV must be one of development, production, or test');
  }

  const logLevel = (asString(config, 'LOG_LEVEL') ?? 'info') as AppConfig['LOG_LEVEL'];
  if (!LOG_LEVELS.has(logLevel)) {
    throw new Error('LOG_LEVEL must be one of error, warn, info, or debug');
  }

  const midnightNetworkId = (asString(config, 'MIDNIGHT_NETWORK_ID') ??
    'undeployed') as AppConfig['MIDNIGHT_NETWORK_ID'];
  if (!NETWORK_IDS.has(midnightNetworkId)) {
    throw new Error('MIDNIGHT_NETWORK_ID must be one of undeployed, devnet, testnet, or mainnet');
  }

  const result: AppConfig = {
    DATABASE_URL: requireString(config, 'DATABASE_URL'),
    JWT_SECRET: requireString(config, 'JWT_SECRET'),
    JWT_EXPIRY: asString(config, 'JWT_EXPIRY') ?? '7d',
    NODE_ENV: nodeEnv,
    LOG_LEVEL: logLevel,
    API_PREFIX: asString(config, 'API_PREFIX') ?? '/api/v1',
    API_PORT: asPort(config, 'API_PORT'),
    PORT: asPort(config, 'PORT'),
    ALLOWED_ORIGINS: asString(config, 'ALLOWED_ORIGINS') ?? '',
    CORS_ORIGIN: asString(config, 'CORS_ORIGIN') ?? 'http://localhost:3000',
    ADVERTISER_LOGIN_EMAIL: asString(config, 'ADVERTISER_LOGIN_EMAIL'),
    ADVERTISER_LOGIN_PASSWORD: asString(config, 'ADVERTISER_LOGIN_PASSWORD'),
    ADVERTISER_LOGIN_NAME: asString(config, 'ADVERTISER_LOGIN_NAME'),
    MIDNIGHT_DEV_MODE: asBoolean(config, 'MIDNIGHT_DEV_MODE'),
    MIDNIGHT_NETWORK_ID: midnightNetworkId,
    MIDNIGHT_PRIVATE_STATE_PASSWORD: asString(config, 'MIDNIGHT_PRIVATE_STATE_PASSWORD'),
    MIDNIGHT_PROOF_SERVER_URL: asString(config, 'MIDNIGHT_PROOF_SERVER_URL'),
    MIDNIGHT_INDEXER_GRAPHQL_URL: asString(config, 'MIDNIGHT_INDEXER_GRAPHQL_URL'),
    MIDNIGHT_INDEXER_WS_URL: asString(config, 'MIDNIGHT_INDEXER_WS_URL'),
    MATCH_REGISTRY_CONTRACT_ADDRESS: asString(config, 'MATCH_REGISTRY_CONTRACT_ADDRESS'),
    AUCTION_CONTRACT_ADDRESS: asString(config, 'AUCTION_CONTRACT_ADDRESS'),
    REWARD_CONTRACT_ADDRESS: asString(config, 'REWARD_CONTRACT_ADDRESS'),
    MIDNIGHT_ZK_ARTIFACTS_DIR: asString(config, 'MIDNIGHT_ZK_ARTIFACTS_DIR'),
    MIDNIGHT_PRIVATE_STATE_STORE: asString(config, 'MIDNIGHT_PRIVATE_STATE_STORE'),
  };

  if (result.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (
    result.JWT_SECRET === 'change_me_in_production_min_32_chars' ||
    result.JWT_SECRET === 'your-secret-key-minimum-32-characters-long-please'
  ) {
    throw new Error('JWT_SECRET must be changed from the example value');
  }

  ensureEmail(result.ADVERTISER_LOGIN_EMAIL, 'ADVERTISER_LOGIN_EMAIL');
  ensureUrl(result.MIDNIGHT_PROOF_SERVER_URL, 'MIDNIGHT_PROOF_SERVER_URL');
  ensureUrl(result.MIDNIGHT_INDEXER_GRAPHQL_URL, 'MIDNIGHT_INDEXER_GRAPHQL_URL');
  ensureUrl(result.MIDNIGHT_INDEXER_WS_URL, 'MIDNIGHT_INDEXER_WS_URL');
  ensureStartsWithHex(result.MATCH_REGISTRY_CONTRACT_ADDRESS, 'MATCH_REGISTRY_CONTRACT_ADDRESS');
  ensureStartsWithHex(result.AUCTION_CONTRACT_ADDRESS, 'AUCTION_CONTRACT_ADDRESS');
  ensureStartsWithHex(result.REWARD_CONTRACT_ADDRESS, 'REWARD_CONTRACT_ADDRESS');

  if (result.NODE_ENV === 'production') {
    if (!result.ADVERTISER_LOGIN_EMAIL) {
      throw new Error('ADVERTISER_LOGIN_EMAIL is required in production');
    }

    if (!result.ADVERTISER_LOGIN_PASSWORD) {
      throw new Error('ADVERTISER_LOGIN_PASSWORD is required in production');
    }
  }

  if (!result.MIDNIGHT_DEV_MODE) {
    for (const key of [
      'MIDNIGHT_PROOF_SERVER_URL',
      'MIDNIGHT_INDEXER_GRAPHQL_URL',
      'MIDNIGHT_INDEXER_WS_URL',
      'MIDNIGHT_PRIVATE_STATE_PASSWORD',
      'MATCH_REGISTRY_CONTRACT_ADDRESS',
      'AUCTION_CONTRACT_ADDRESS',
      'REWARD_CONTRACT_ADDRESS',
    ] as const) {
      if (!result[key]) {
        throw new Error(`${key} is required unless MIDNIGHT_DEV_MODE=true`);
      }
    }
  }

  return result;
}

export function loadConfig(): AppConfig {
  return validateConfig(process.env);
}
