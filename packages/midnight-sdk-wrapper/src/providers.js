"use strict";
/**
 * AdMidnight Midnight Provider Factory
 *
 * Assembles the 7-provider MidnightProviders object using the real SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMidnightNetwork = initMidnightNetwork;
exports.buildMidnightProviders = buildMidnightProviders;
const midnight_js_network_id_1 = require("@midnight-ntwrk/midnight-js-network-id");
const midnight_js_level_private_state_provider_1 = require("@midnight-ntwrk/midnight-js-level-private-state-provider");
const midnight_js_indexer_public_data_provider_1 = require("@midnight-ntwrk/midnight-js-indexer-public-data-provider");
const midnight_js_http_client_proof_provider_1 = require("@midnight-ntwrk/midnight-js-http-client-proof-provider");
const midnight_js_node_zk_config_provider_1 = require("@midnight-ntwrk/midnight-js-node-zk-config-provider");
const midnight_js_logger_provider_1 = require("@midnight-ntwrk/midnight-js-logger-provider");
function initMidnightNetwork(networkId) {
    (0, midnight_js_network_id_1.setNetworkId)(networkId);
}
async function buildMidnightProviders(config) {
    if (config.privateStatePassword.length < 16) {
        throw new Error('privateStatePassword must be at least 16 characters (SDK requirement)');
    }
    const privateStateProvider = await (0, midnight_js_level_private_state_provider_1.levelPrivateStateProvider)({
        privateStateStoreName: config.privateStateStoreName,
        privateStoragePasswordProvider: () => config.privateStatePassword,
        accountId: config.accountId,
    });
    const publicDataProvider = (0, midnight_js_indexer_public_data_provider_1.indexerPublicDataProvider)(config.indexerGraphQlUrl, config.indexerWsUrl);
    const proofProvider = (0, midnight_js_http_client_proof_provider_1.httpClientProofProvider)(config.proofServerUrl);
    const zkConfigProvider = (0, midnight_js_node_zk_config_provider_1.nodeZkConfigProvider)(config.zkArtifactsDir);
    const loggerProvider = (0, midnight_js_logger_provider_1.pinoLoggerProvider)();
    return {
        privateStateProvider,
        publicDataProvider,
        proofProvider,
        zkConfigProvider,
        loggerProvider,
    };
}
//# sourceMappingURL=providers.js.map