"use strict";
/**
 * ContractClient — wraps the real Midnight.js contract deployment and invocation API.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployAdContract = deployAdContract;
exports.connectToContract = connectToContract;
async function deployAdContract(providers, config) {
    const compiledContract = await Promise.resolve(`${config.compiledContractModule}`).then(s => __importStar(require(s)));
    const { deployContract } = require('@midnight-ntwrk/midnight-js-contracts');
    const deployed = await deployContract(providers, {
        compiledContract: compiledContract.default,
        privateStateId: config.privateStateId,
        initialPrivateState: config.initialPrivateState,
    });
    return {
        address: deployed.deployTxData.public.contractAddress,
        callTx: deployed.callTx,
    };
}
async function connectToContract(providers, contractAddress, compiledContractModule, privateStateId) {
    const compiledContract = await Promise.resolve(`${compiledContractModule}`).then(s => __importStar(require(s)));
    const { findDeployedContract } = require('@midnight-ntwrk/midnight-js-contracts');
    const found = await findDeployedContract(providers, {
        contractAddress,
        compiledContract: compiledContract.default,
        privateStateId,
        initialPrivateState: {},
    });
    return {
        address: contractAddress,
        callTx: found.callTx,
    };
}
//# sourceMappingURL=ContractClient.js.map