/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Common
import {
    Logger,
    Checks,
    LogLevelDesc,
    LoggerProvider,
} from "@hyperledger/cactus-common";
import "dotenv/config";
import {
ApiServer,
AuthorizationProtocol,
ConfigService,
Configuration,
ICactusApiServerOptions,
} from "@hyperledger/cactus-cmd-api-server";
import CryptoMaterial from "./crypto-material/crypto-material.json";

// Besu
import {
    DefaultApi as BesuApi,
    DeployContractSolidityBytecodeV1Request as DeployContractSolidityBytecodeV1RequestBesu,
    PluginFactoryLedgerConnector as PluginFactoryBesuLedgerConnector,
    PluginLedgerConnectorBesu,
    Web3SigningCredentialType as Web3SigningCredentialTypeBesu,
  } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import BesuCBDCTokenJSON from "./solidity/bok-cbdc/CBDCToken.sol/CBDCToken.json";
import BesuDC1TokenJSON from "./solidity/bok-cbdc/DC1Token.sol/DC1Token.json";
import BesuDemoHelperJSON from "./solidity/bok-cbdc/DemoHelpers.sol/DemoHelpers.json";
import BesuHashTimeLockJSON from "./solidity/bok-cbdc/HashedTimeLockContract.sol/HashedTimeLockContract.json";

import { BesuUtil } from "./besu/besu-util";

// Parsec
import {
    DefaultApi as ParsecApi,
    DeployContractSolidityBytecodeV1Request as DeployContractSolidityBytecodeV1RequestParsec,
    Web3SigningCredentialType as Web3SigningCredentialTypeParsec,
    PluginFactoryLedgerConnector as PluginFactoryParsecLedgerConnector,
    PluginLedgerConnectorParsec,
  } from "@hyperledger/cactus-plugin-ledger-connector-parsec";
import ParsecHashTimeLockJSON from "./solidity/parsec-cbdc/HashedTimeLockContract.sol/HashedTimeLockContract.json";
import ParsecCBDCTokenJSON from "./solidity/parsec-cbdc/Token.sol/Test_Token.json";
import ParsecDemoHelperJSON from "./solidity/parsec-cbdc/DemoHelpers.sol/DemoHelpers.json";
import { ParsecUtil } from "./parsec/parsec-util";

/***********************************************************************/
// Scenario as followings
// 1. Initialization
// 2. 
/***********************************************************************/
// Logger
const logLevel: LogLevelDesc = getLogLevel(`${process.env.LOG_LEVEL}`);
const logSetting = {
    label : `${process.env.LOG_LABEL}`,
    level : logLevel,
};
const log = LoggerProvider.getOrCreate(logSetting);

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
    const config = new Configuration({ basePath: `http://${process.env.API_HOST}:${process.env.API_SERVER_PORT}` });

    /***********************************************************************/
    // Besu Init
    /***********************************************************************/
    // Besu Util
    const besuUtil = new BesuUtil();

    // Create Besu API
    const besuApi = new BesuApi(config);

    /***********************************************************************/
    // Deploy Besu Contracts
    /***********************************************************************/
    log.info("Deploying Besu Contracts...");

    // Besu Key Id
    const besuKeyId = CryptoMaterial.keychains.keychain1.id;

    // BesuCBDCTokenJSON
    constructorArgs = [CryptoMaterial.demoApps.besu.deploy.address];
    response = await besuUtil.deployBesuContracts(
        log,
        besuApi, 
        besuKeyId,
        BesuCBDCTokenJSON, 
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        constructorArgs,
    );
    besuCBDCContractAddress = response.contractAddress!;
    log.info("besuCBDCContractAddress : " + besuCBDCContractAddress);

    // BesuDC1TokenJSON
    constructorArgs = [CryptoMaterial.demoApps.besu.deploy.address];
    response = await besuUtil.deployBesuContracts(
        log,
        besuApi, 
        besuKeyId, 
        BesuDC1TokenJSON, 
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        constructorArgs,
    );
    besuDC1ContractAddress = response.contractAddress!;
    log.info("besuDC1ContractAddress : " + besuDC1ContractAddress);

    // BesuDemoHelperJSON
    response = await besuUtil.deployBesuContracts(
        log,
        besuApi, 
        besuKeyId,
        BesuDemoHelperJSON, 
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        undefined,
    );
    besuDemoHelpderContractAddress = response.contractAddress!;
    log.info("besuDemoHelpderContractAddress : " + besuDemoHelpderContractAddress);

    // BesuHashTimeLockJSON
    response = await besuUtil.deployBesuContracts(
        log,
        besuApi, 
        besuKeyId, 
        BesuHashTimeLockJSON, 
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        undefined,
    );
    besuHashTimeLockContractAddress = response.contractAddress!;
    log.info("BesuHashTimeLockContractAddress : " + besuHashTimeLockContractAddress);
    
    log.info("Demo Besu Contracts deployed.");

    /***********************************************************************/
    // Besu : Token Distribution
    /***********************************************************************/
    // log.info("Besu Token Distribution Starting...");

    // Mint CBDC - BoK
    const LCBDCAmount = 100000000000;
    params = [CryptoMaterial.demoApps.besu.deploy.address, LCBDCAmount];
    log.info("About to MINT [" + LCBDCAmount + "] CBDC to [" + CryptoMaterial.demoApps.besu.deploy.address + "]");
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_SEND,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        besuCBDCContractAddress,
        "mint",
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        params,
    );
    log.info("MINT CBDC success.");

    // Get Balance - BoK
    params = [CryptoMaterial.demoApps.besu.deploy.address];
    log.info("About to BALANCEOF [" + CryptoMaterial.demoApps.besu.deploy.address + "]");
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi,
        besuKeyId,
        BesuCBDCTokenJSON.contractName,
        besuCBDCContractAddress,
        "balanceOf",
        CryptoMaterial.demoApps.besu.deploy.address,
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        params,
    );
    log.info("BALANCE [" + CryptoMaterial.demoApps.besu.deploy.address + "] : " + response);

    /***********************************************************************/
    // Parsec Init
    /***********************************************************************/
    // Parsec Util
    const parsecUtil = new ParsecUtil();

    // Create Parsec API
    const parsecApi = new ParsecApi(config);

    /***********************************************************************/
    // Deploy Parsec Contracts
    /***********************************************************************/
    log.info("Deploying Parsec Contracts...");

    // Parsec Key Id
    const parsecKeyId = CryptoMaterial.keychains.keychain2.id;

    // ParsecCBDCTokenJSON
    constructorArgs = ["100000000000", "DOLLAR", "2", "FCBDC"];
    parsecCBDCContractAddress = await parsecUtil.deployParsecContracts(
        log,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON,
        CryptoMaterial.demoApps.parsec.deploy.address, 
        CryptoMaterial.demoApps.parsec.deploy.privateKey,
        constructorArgs,
    );
    log.info("parsecCBDCContractAddress : " + parsecCBDCContractAddress);

    // ParsecDemoHelperJSON
    parsecDemoHelperContractAddress = await parsecUtil.deployParsecContracts(
        log,
        parsecApi, 
        parsecKeyId, 
        ParsecDemoHelperJSON, 
        CryptoMaterial.demoApps.parsec.deploy.address, 
        CryptoMaterial.demoApps.parsec.deploy.privateKey,
        undefined,
    );
    log.info("parsecDemoHelperContractAddress : " + parsecDemoHelperContractAddress);

    // ParsecHashTimeLockJSON
    parsecHashTimeLockContractAddress = await parsecUtil.deployParsecContracts(
        log,
        parsecApi,
        parsecKeyId, 
        ParsecHashTimeLockJSON, 
        CryptoMaterial.demoApps.parsec.deploy.address, 
        CryptoMaterial.demoApps.parsec.deploy.privateKey,
        undefined,
    );
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

function getLogLevel(logLevel: string): LogLevelDesc {

    if(logLevel.toUpperCase() === "WARN"){
        const logLevelDesc: LogLevelDesc = "WARN";
        return logLevelDesc;
    }
    else if(logLevel.toUpperCase() === "ERROR"){
        const logLevelDesc: LogLevelDesc = "ERROR";
        return logLevelDesc;
    }
    else if(logLevel.toUpperCase() === "DEBUG"){
        const logLevelDesc: LogLevelDesc = "DEBUG";
        return logLevelDesc;
    }
    else if(logLevel.toUpperCase() === "TRACE"){
        const logLevelDesc: LogLevelDesc = "TRACE";
        return logLevelDesc;
    }
    else {
        const logLevelDesc: LogLevelDesc = "INFO";
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