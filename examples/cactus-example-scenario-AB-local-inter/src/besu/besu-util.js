"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BesuUtil = void 0;
const cactus_plugin_ledger_connector_besu_1 = require("@hyperledger/cactus-plugin-ledger-connector-besu");
require("dotenv/config");
class BesuUtil {
    // deploy besu contract
    async deployBesuContracts(log, besuApi, keychainId, contractJson, address, privateKey, constructorArgs) {
        // request
        const deployContractRequest = {
            keychainId: keychainId,
            contractName: contractJson.contractName,
            contractAbi: contractJson.abi,
            constructorArgs: constructorArgs,
            web3SigningCredential: {
                ethAccount: address,
                secret: privateKey,
                type: cactus_plugin_ledger_connector_besu_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            bytecode: contractJson.bytecode,
            gas: 10000000,
        };
        log.debug("[DEPLOY_BESU_CONTRACTS] Request(SEND) : " + JSON.stringify(deployContractRequest));
        // process
        const deployContractResponse = await besuApi.deployContractSolBytecodeV1(deployContractRequest);
        // response
        if (deployContractResponse === undefined) {
            log.error("error when deploying smart contract");
            throw new Error("error when deploying smart contract");
        }
        else {
            log.debug("[DEPLOY_BESU_CONTRACTS] Response(SEND) : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
            return deployContractResponse.data.transactionReceipt;
        }
    }
    // invoke besu contract
    async invokeBesuContracts(log, invocationType, besuApi, keychainId, contractName, contractAddress, methodName, address, privateKey, params) {
        // request
        const invokeContractRequest = {
            keychainId: keychainId,
            contractName: contractName,
            contractAddress: contractAddress,
            invocationType: invocationType,
            methodName: methodName,
            signingCredential: {
                ethAccount: address,
                secret: privateKey,
                type: cactus_plugin_ledger_connector_besu_1.Web3SigningCredentialType.PrivateKeyHex,
            },
            params: params,
            gas: 10000000,
        };
        log.info("[INVOKE_BESU_CONTRACTS] Request(" + invocationType + ") : " + JSON.stringify(invokeContractRequest));
        // process
        const invokeContractResponse = await besuApi.invokeContractV1(invokeContractRequest);
        // response
        if (invokeContractResponse === undefined ||
            invokeContractResponse.data.success === false) {
            log.error("error when invoking smart contract");
            throw new Error("error when deploying smart contract");
        }
        else {
            if (invocationType === "SEND") {
                log.info("[INVOKE_BESU_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
                return invokeContractResponse.data;
            }
            else {
                log.info("[INVOKE_BESU_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data.callOutput));
                return invokeContractResponse.data.callOutput;
            }
        }
    }
}
exports.BesuUtil = BesuUtil;
