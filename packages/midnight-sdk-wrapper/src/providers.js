"use strict";
/**
 * AdMidnight Midnight Provider Factory
 *
 * Assembles the 7-provider MidnightProviders object using the real SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMidnightNetwork = initMidnightNetwork;
exports.buildMidnightProviders = buildMidnightProviders;
// Providers are required lazily inside functions to avoid eager runtime imports
function initMidnightNetwork(networkId) {
    const { setNetworkId } = require('@midnight-ntwrk/midnight-js-network-id');
    setNetworkId(networkId);
}
async function buildMidnightProviders(config) {
    if (config.privateStatePassword.length < 16) {
        throw new Error('privateStatePassword must be at least 16 characters (SDK requirement)');
    }
    const { levelPrivateStateProvider } = require('@midnight-ntwrk/midnight-js-level-private-state-provider');
    const { indexerPublicDataProvider } = require('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
    const { httpClientProofProvider } = require('@midnight-ntwrk/midnight-js-http-client-proof-provider');
    const { nodeZkConfigProvider } = require('@midnight-ntwrk/midnight-js-node-zk-config-provider');
    const { pinoLoggerProvider } = require('@midnight-ntwrk/midnight-js-logger-provider');

    const privateStateProvider = await levelPrivateStateProvider({
        privateStateStoreName: config.privateStateStoreName,
        privateStoragePasswordProvider: () => config.privateStatePassword,
        accountId: config.accountId,
    });
    const publicDataProvider = indexerPublicDataProvider(config.indexerGraphQlUrl, config.indexerWsUrl);
    const proofProvider = httpClientProofProvider(config.proofServerUrl);
    const zkConfigProvider = nodeZkConfigProvider(config.zkArtifactsDir);
    const loggerProvider = pinoLoggerProvider();
    return {
        privateStateProvider,
        publicDataProvider,
        proofProvider,
        zkConfigProvider,
        loggerProvider,
    };
}
//# sourceMappingURL=providers.js.map