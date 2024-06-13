"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Common
const cactus_common_1 = require("@hyperledger/cactus-common");
require("dotenv/config");
const cactus_cmd_api_server_1 = require("@hyperledger/cactus-cmd-api-server");
const crypto_material_json_1 = __importDefault(require("./crypto-material/crypto-material.json"));
// Besu
const cactus_plugin_ledger_connector_besu_1 = require("@hyperledger/cactus-plugin-ledger-connector-besu");
const CBDCToken_json_1 = __importDefault(require("./solidity/bok-cbdc/CBDCToken.sol/CBDCToken.json"));
const DC1Token_json_1 = __importDefault(require("./solidity/bok-cbdc/DC1Token.sol/DC1Token.json"));
const DemoHelpers_json_1 = __importDefault(require("./solidity/bok-cbdc/DemoHelpers.sol/DemoHelpers.json"));
const HashedTimeLockContract_json_1 = __importDefault(require("./solidity/bok-cbdc/HashedTimeLockContract.sol/HashedTimeLockContract.json"));
const besu_util_1 = require("./besu/besu-util");
// Parsec
const cactus_plugin_ledger_connector_parsec_1 = require("@hyperledger/cactus-plugin-ledger-connector-parsec");
const HashedTimeLockContract_json_2 = __importDefault(require("./solidity/parsec-cbdc/HashedTimeLockContract.sol/HashedTimeLockContract.json"));
const Test_Token_json_1 = __importDefault(require("./solidity/parsec-cbdc/Token.sol/Test_Token.json"));
const DemoHelpers_json_2 = __importDefault(require("./solidity/parsec-cbdc/DemoHelpers.sol/DemoHelpers.json"));
const parsec_util_1 = require("./parsec/parsec-util");
/***********************************************************************/
// Scenario as followings
// 1. Initialization
// 2. 
/***********************************************************************/
// Logger
const logLevel = getLogLevel(`${process.env.LOG_LEVEL}`);
const logSetting = {
    label: `${process.env.LOG_LABEL}`,
    level: logLevel,
};
const log = cactus_common_1.LoggerProvider.getOrCreate(logSetting);
// Besu
let besuCBDCContractAddress = "";
let besuDC1ContractAddress = "";
let besuDemoHelpderContractAddress = "";
let besuHashTimeLockContractAddress = "";
// Parsec
let parsecCBDCContractAddress = "";
let parsecDemoHelperContractAddress = "";
let parsecHashTimeLockContractAddress = "";
const INVOCATION_TYPE_SEND = "SEND";
const INVOCATION_TYPE_CALL = "CALL";
async function main() {
    log.info("Starting BOK HTLC Scenario A, B...");
    // Common
    let constructorArgs = [];
    let params = [];
    let response = undefined;
    const config = new cactus_cmd_api_server_1.Configuration({ basePath: `http://${process.env.API_HOST}:${process.env.API_SERVER_PORT}` });
    /***********************************************************************/
    // Besu Init
    /***********************************************************************/
    // Besu Util
    const besuUtil = new besu_util_1.BesuUtil();
    // Create Besu API
    const besuApi = new cactus_plugin_ledger_connector_besu_1.DefaultApi(config);
    /***********************************************************************/
    // Deploy Besu Contracts
    /***********************************************************************/
    log.info("Deploying Besu Contracts...");
    // Besu Key Id
    const besuKeyId = crypto_material_json_1.default.keychains.keychain1.id;
    // BesuCBDCTokenJSON
    constructorArgs = [crypto_material_json_1.default.demoApps.besu.deploy.address];
    response = await besuUtil.deployBesuContracts(log, besuApi, besuKeyId, CBDCToken_json_1.default, crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, constructorArgs);
    besuCBDCContractAddress = response.contractAddress;
    log.info("besuCBDCContractAddress : " + besuCBDCContractAddress);
    // BesuDC1TokenJSON
    constructorArgs = [crypto_material_json_1.default.demoApps.besu.deploy.address];
    response = await besuUtil.deployBesuContracts(log, besuApi, besuKeyId, DC1Token_json_1.default, crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, constructorArgs);
    besuDC1ContractAddress = response.contractAddress;
    log.info("besuDC1ContractAddress : " + besuDC1ContractAddress);
    // BesuDemoHelperJSON
    response = await besuUtil.deployBesuContracts(log, besuApi, besuKeyId, DemoHelpers_json_1.default, crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, undefined);
    besuDemoHelpderContractAddress = response.contractAddress;
    log.info("besuDemoHelpderContractAddress : " + besuDemoHelpderContractAddress);
    // BesuHashTimeLockJSON
    response = await besuUtil.deployBesuContracts(log, besuApi, besuKeyId, HashedTimeLockContract_json_1.default, crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, undefined);
    besuHashTimeLockContractAddress = response.contractAddress;
    log.info("BesuHashTimeLockContractAddress : " + besuHashTimeLockContractAddress);
    log.info("Demo Besu Contracts deployed.");
    /***********************************************************************/
    // Besu : Token Distribution
    /***********************************************************************/
    // log.info("Besu Token Distribution Starting...");
    // Mint CBDC - BoK
    const LCBDCAmount = 100000000000;
    params = [crypto_material_json_1.default.demoApps.besu.deploy.address, LCBDCAmount];
    log.info("About to MINT [" + LCBDCAmount + "] CBDC to [" + crypto_material_json_1.default.demoApps.besu.deploy.address + "]");
    response = await besuUtil.invokeBesuContracts(log, INVOCATION_TYPE_SEND, besuApi, besuKeyId, CBDCToken_json_1.default.contractName, besuCBDCContractAddress, "mint", crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, params);
    log.info("MINT CBDC success.");
    // Get Balance - BoK
    params = [crypto_material_json_1.default.demoApps.besu.deploy.address];
    log.info("About to BALANCEOF [" + crypto_material_json_1.default.demoApps.besu.deploy.address + "]");
    response = await besuUtil.invokeBesuContracts(log, INVOCATION_TYPE_CALL, besuApi, besuKeyId, CBDCToken_json_1.default.contractName, besuCBDCContractAddress, "balanceOf", crypto_material_json_1.default.demoApps.besu.deploy.address, crypto_material_json_1.default.demoApps.besu.deploy.privateKey, params);
    log.info("BALANCE [" + crypto_material_json_1.default.demoApps.besu.deploy.address + "] : " + response);
    /***********************************************************************/
    // Parsec Init
    /***********************************************************************/
    // Parsec Util
    const parsecUtil = new parsec_util_1.ParsecUtil();
    // Create Parsec API
    const parsecApi = new cactus_plugin_ledger_connector_parsec_1.DefaultApi(config);
    /***********************************************************************/
    // Deploy Parsec Contracts
    /***********************************************************************/
    log.info("Deploying Parsec Contracts...");
    // Parsec Key Id
    const parsecKeyId = crypto_material_json_1.default.keychains.keychain2.id;
    // ParsecCBDCTokenJSON
    constructorArgs = ["100000000000", "DOLLAR", "2", "FCBDC"];
    parsecCBDCContractAddress = await parsecUtil.deployParsecContracts(log, parsecApi, parsecKeyId, Test_Token_json_1.default, crypto_material_json_1.default.demoApps.parsec.deploy.address, crypto_material_json_1.default.demoApps.parsec.deploy.privateKey, constructorArgs);
    log.info("parsecCBDCContractAddress : " + parsecCBDCContractAddress);
    // ParsecDemoHelperJSON
    parsecDemoHelperContractAddress = await parsecUtil.deployParsecContracts(log, parsecApi, parsecKeyId, DemoHelpers_json_2.default, crypto_material_json_1.default.demoApps.parsec.deploy.address, crypto_material_json_1.default.demoApps.parsec.deploy.privateKey, undefined);
    log.info("parsecDemoHelperContractAddress : " + parsecDemoHelperContractAddress);
    // ParsecHashTimeLockJSON
    parsecHashTimeLockContractAddress = await parsecUtil.deployParsecContracts(log, parsecApi, parsecKeyId, HashedTimeLockContract_json_2.default, crypto_material_json_1.default.demoApps.parsec.deploy.address, crypto_material_json_1.default.demoApps.parsec.deploy.privateKey, undefined);
    log.info("parsecHashTimeLockContractAddress : " + parsecHashTimeLockContractAddress);
    log.info("Demo Parsec Contracts deployed.");
    // set Asset Reference smart contract address in cbdc one (sidechain contract)
    // const insertARContractAddress = await besuApiClient.invokeContractV1({
    //     contractName: CBDCcontractJson.contractName,
    //     invocationType: EthContractInvocationType.Send,
    //     methodName: "setAssetReferenceContract",
    //     gas: 1000000,
    //     params: [
    //     deployAssetReferenceContractResponse.data.transactionReceipt
    //         .contractAddress,
    //     ],
    //     signingCredential: {
    //     ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
    //     secret: CryptoMaterial.accounts["bridge"].privateKey,
    //     type: Web3SigningCredentialType.PrivateKeyHex,
    //     },
    //     keychainId: CryptoMaterial.keychains.keychain2.id,
    // } as BesuInvokeContractV1Request);
}
function getLogLevel(logLevel) {
    if (logLevel.toUpperCase() === "WARN") {
        const logLevelDesc = "WARN";
        return logLevelDesc;
    }
    else if (logLevel.toUpperCase() === "ERROR") {
        const logLevelDesc = "ERROR";
        return logLevelDesc;
    }
    else if (logLevel.toUpperCase() === "DEBUG") {
        const logLevelDesc = "DEBUG";
        return logLevelDesc;
    }
    else if (logLevel.toUpperCase() === "TRACE") {
        const logLevelDesc = "TRACE";
        return logLevelDesc;
    }
    else {
        const logLevelDesc = "INFO";
        return logLevelDesc;
    }
}
// deploy besu contract
// async function deployBesuContracts(besuApiClient: BesuApi, keychainId: string, contractJson: any, address: string, privateKey: string): Promise<string> {
//     // request
//     const deployContractRequest: DeployContractSolidityBytecodeV1Request = {
//         keychainId: keychainId,
//         contractName: contractJson.contractName,
//         contractAbi: contractJson.abi,
//         constructorArgs: [],
//         web3SigningCredential: {
//           ethAccount: address,
//           secret: privateKey,
//           type: Web3SigningCredentialType.PrivateKeyHex,
//         },
//         bytecode: contractJson.bytecode,
//         gas: 10000000,
//     };
//     log.debug("Request : " + JSON.stringify(deployContractRequest));
//     // process
//     const deployContractResponse = await besuApiClient.deployContractSolBytecodeV1(deployContractRequest);
//     // response
//     if (deployContractResponse == undefined) {
//         log.error("error when deploying CBDC smart contract");
//         throw new Error("error when deploying CBDC smart contract");
//     }
//     else{
//         log.debug("Response : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
//         log.debug("Contract Address : " + deployContractResponse.data.transactionReceipt.contractAddress);
//         return deployContractResponse.data.transactionReceipt.contractAddress!;
//     }
// }
// deploy parsec contract
// async function deployParsecContracts(parsecApiClient: ParsecApi, keychainId: string, contractJson: any, address: string, privateKey: string): Promise<string> {
//     // request
//     const deployContractRequest: DeployContractSolidityBytecodeV1Request = {
//         keychainId: keychainId,
//         contractName: contractJson.contractName,
//         contractAbi: contractJson.abi,
//         constructorArgs: [],
//         web3SigningCredential: {
//           ethAccount: address,
//           secret: privateKey,
//           type: Web3SigningCredentialType.PrivateKeyHex,
//         },
//         bytecode: contractJson.bytecode,
//         gas: 10000000,
//     };
//     log.debug("Request : " + JSON.stringify(deployContractRequest));
//     // process
//     const deployContractResponse = await besuApiClient.deployContractSolBytecodeV1(deployContractRequest);
//     // response
//     if (deployContractResponse == undefined) {
//         log.error("error when deploying CBDC smart contract");
//         throw new Error("error when deploying CBDC smart contract");
//     }
//     else{
//         log.debug("Response : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
//         log.debug("Contract Address : " + deployContractResponse.data.transactionReceipt.contractAddress);
//         return deployContractResponse.data.transactionReceipt.contractAddress!;
//     }
// }
// main
main();
