"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsecUtil = void 0;
const cactus_plugin_ledger_connector_parsec_1 = require("@hyperledger/cactus-plugin-ledger-connector-parsec");
const cactus_plugin_htlc_coordinator_parsec_1 = require("@hyperledger/cactus-plugin-htlc-coordinator-parsec");
require("dotenv/config");
const waait_1 = __importDefault(require("waait"));
const retryCount = 5;
const waitTimeout = 3000;
class ParsecUtil {
    // deploy parsec contract
    async deployParsecContracts(log, parsecApi, keychainId, contractJson, address, privateKey, constructorArgs) {
        // request
        const deployContractRequest = {
            keychainId: keychainId,
            contractName: contractJson.contractName,
            contractAbi: contractJson.abi,
            constructorArgs: constructorArgs,
            web3SigningCredential: {
                ethAccount: address,
                secret: privateKey,
                type: cactus_plugin_ledger_connector_parsec_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            bytecode: contractJson.bytecode,
            gas: 10000000,
        };
        log.debug("[PARSEC_DEPLOY_CONTRACTS] Request(SEND) : " + JSON.stringify(deployContractRequest));
        for (let i = 0; i < retryCount; i++) {
            try {
                // process
                const deployContractResponse = await parsecApi.deployContractSolBytecodeV1(deployContractRequest);
                // response
                if (deployContractResponse == undefined) {
                    log.error("error when deploying smart contract");
                    throw new Error("error when deploying smart contract");
                }
                else {
                    log.debug("[PARSEC_DEPLOY_CONTRACTS] Response(SEND) : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
                    return deployContractResponse.data.transactionReceipt.contractAddress;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await (0, waait_1.default)(waitTimeout);
            }
        }
        throw new Error("error when deploying smart contract(retried " + retryCount + " times)");
    }
    // invoke parsec contract
    async invokeParsecContracts(log, invocationType, parsecApi, keychainId, contractName, methodName, address, privateKey, params) {
        // request
        const invokeContractRequest = {
            keychainId: keychainId,
            contractName: contractName,
            invocationType: invocationType,
            methodName: methodName,
            signingCredential: {
                ethAccount: address,
                secret: privateKey,
                type: cactus_plugin_ledger_connector_parsec_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            params: params,
            gas: 10000000,
        };
        log.debug("[PARSEC_INVOKE_CONTRACTS] Request(" + invocationType + ") : " + JSON.stringify(invokeContractRequest));
        for (let i = 0; i < retryCount; i++) {
            try {
                // process
                const invokeContractResponse = await parsecApi.invokeContractV1(invokeContractRequest);
                // response
                if (invokeContractResponse === undefined ||
                    invokeContractResponse.data.success === false) {
                    log.error("error when invoking smart contract");
                    throw new Error("error when deploying smart contract");
                }
                else {
                    log.debug("[PARSEC_INVOKE_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
                    return invokeContractResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await (0, waait_1.default)(waitTimeout);
            }
        }
    }
    // own parsec htlc
    async ownParsecHtlc(log, parsecApi, connectorInstanceId, keychainId, hashTimeLockAddress, hashLock, inputAmount, outputAmount, expiration, cbdcTokenAddress, senderAddress, senderPrivateKey, receiverAddress, outputNetwork, outputAdddress) {
        // request
        const ownHTLCRequest = {
            htlcPackage: cactus_plugin_htlc_coordinator_parsec_1.HtlcPackage.ParsecErc20,
            connectorInstanceId,
            keychainId,
            constructorArgs: [hashTimeLockAddress],
            web3SigningCredential: {
                ethAccount: senderAddress,
                secret: senderPrivateKey,
                type: cactus_plugin_ledger_connector_parsec_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            expiration,
            hashLock,
            tokenAddress: cbdcTokenAddress,
            receiver: receiverAddress,
            outputNetwork: outputNetwork,
            outputAddress: outputAdddress,
            gas: 10000000,
        };
        log.debug("[PARSEC_OWN_HTLC] Request : " + JSON.stringify(ownHTLCRequest));
        for (let i = 0; i < retryCount; i++) {
            try {
                // process
                const onwHTLCResponse = await parsecApi.ownHtlcV1(ownHTLCRequest);
                // response
                if (onwHTLCResponse === undefined ||
                    onwHTLCResponse.data.success === false) {
                    log.error("error when own htlc");
                    throw new Error("error when own htlc");
                }
                else {
                    log.debug("[PARSEC_OWN_HTLC] Response : " + JSON.stringify(onwHTLCResponse.data));
                    return onwHTLCResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await (0, waait_1.default)(waitTimeout);
            }
        }
    }
    // Get single HTLC Status
    async counterpartyParsecHtlc(log, parsecApi, connectorInstanceId, keychainId, htlcId, signerAddress, signerPrivateKey) {
        // request
        const counterpartyHTLCRequest = {
            htlcPackage: cactus_plugin_htlc_coordinator_parsec_1.HtlcPackage.ParsecErc20,
            connectorInstanceId,
            keychainId,
            htlcId,
            web3SigningCredential: {
                ethAccount: signerAddress,
                secret: signerPrivateKey,
                type: cactus_plugin_ledger_connector_parsec_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            gas: 10000000,
        };
        log.debug("[PARSEC_COUNTERPARTY_HTLC] Request : " + JSON.stringify(counterpartyHTLCRequest));
        for (let i = 0; i < retryCount; i++) {
            try {
                // process
                const counterpartyHTLCResponse = await parsecApi.counterpartyHtlcV1(counterpartyHTLCRequest);
                // response
                if (counterpartyHTLCResponse === undefined ||
                    counterpartyHTLCResponse.data.success === false) {
                    log.error("error when counterparty htlc");
                    throw new Error("error when counterparty htlc");
                }
                else {
                    log.debug("[PARSEC_COUNTERPARTY_HTLC] Response : " + JSON.stringify(counterpartyHTLCResponse.data));
                    return counterpartyHTLCResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await (0, waait_1.default)(waitTimeout);
            }
        }
    }
    // withdraw htlc
    async withdrawParsecCounterparty(log, parsecApi, connectorInstanceId, keychainId, htlcId, secret, signerAddress, signerPrivateKey) {
        // request
        const withdrawCounterpartyRequest = {
            htlcPackage: cactus_plugin_htlc_coordinator_parsec_1.HtlcPackage.ParsecErc20,
            connectorInstanceId,
            keychainId,
            web3SigningCredential: {
                ethAccount: signerAddress,
                secret: signerPrivateKey,
                type: cactus_plugin_ledger_connector_parsec_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            htlcId,
            secret,
            gas: 10000000,
        };
        log.debug("[PARSEC_WITHDRAW_COUNTERPARTY] Request : " + JSON.stringify(withdrawCounterpartyRequest));
        for (let i = 0; i < retryCount; i++) {
            try {
                // process
                const withdrawCounterpartyResponse = await parsecApi.withdrawCounterpartyV1(withdrawCounterpartyRequest);
                // response
                if (withdrawCounterpartyResponse === undefined ||
                    withdrawCounterpartyResponse.data.success === false) {
                    log.error("error when withdraw counterparty");
                    throw new Error("error when withdraw counterparty");
                }
                else {
                    log.debug("[PARSEC_WITHDRAW_COUNTERPARTY] Response : " + JSON.stringify(withdrawCounterpartyResponse.data));
                    return withdrawCounterpartyResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await (0, waait_1.default)(waitTimeout);
            }
        }
    }
}
exports.ParsecUtil = ParsecUtil;
