"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsecUtil = void 0;
const cactus_plugin_ledger_connector_parsec_1 = require("@hyperledger/cactus-plugin-ledger-connector-parsec");
require("dotenv/config");
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
        log.debug("Request : " + JSON.stringify(deployContractRequest));
        // process
        const deployContractResponse = await parsecApi.deployContractSolBytecodeV1(deployContractRequest);
        // response
        if (deployContractResponse == undefined) {
            log.error("error when deploying smart contract");
            throw new Error("error when deploying smart contract");
        }
        else {
            log.debug("Response : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
            log.debug("Contract Address : " + deployContractResponse.data.transactionReceipt.contractAddress);
            return deployContractResponse.data.transactionReceipt.contractAddress;
        }
    }
}
exports.ParsecUtil = ParsecUtil;
