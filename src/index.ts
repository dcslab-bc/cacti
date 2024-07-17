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
import {table} from "table";
import wait from "waait";
import { v4 as uuidv4 } from "uuid";
import { encodeParameter } from "web3-eth-abi";
import { keccak256 } from "web3-utils";

// Besu
import {
    DefaultApi as BesuApi,
    DeployContractSolidityBytecodeV1Request as DeployContractSolidityBytecodeV1RequestBesu,
    PluginFactoryLedgerConnector as PluginFactoryBesuLedgerConnector,
    PluginLedgerConnectorBesu,
    Web3SigningCredentialType as Web3SigningCredentialTypeBesu,
  } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import {
    DefaultApi as HtlcCoordinatorBesuApi,
} from "@hyperledger/cactus-plugin-htlc-coordinator-besu";
import BesuCBDCTokenJSON from "./solidity/bok-cbdc/CBDCToken.sol/LCBDC_Token.json";
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
  import {
    DefaultApi as HtlcCoordinatorParsecApi,
} from "@hyperledger/cactus-plugin-htlc-coordinator-parsec";
import ParsecHashTimeLockJSON from "./solidity/parsec-cbdc/HashedTimeLockContract.sol/HashedTimeLockContract.json";
import ParsecCBDCTokenJSON from "./solidity/parsec-cbdc/Token.sol/FCBDC_Token.json";
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

const INVOCATION_TYPE_SEND = "SEND";
const INVOCATION_TYPE_CALL = "CALL";

async function main() {

    log.info("###########################################################################");
    log.info("BoK HTLC Scenario A, B - Initialize");
    log.info("###########################################################################");
    log.info("");

    /***********************************************************************/
    // Scenario AB - init
    /***********************************************************************/
    // log
    const BEFORE_SEND = "BEFORE";
    const AFTER_SEND = "DONE";

    const localOutputNetwork = "LCBDC";
    const foreignOutputNetwork = "FCBDC";

    const besuLedgerName = "BESU";
    const parsecLedgerName = "PARSEC";
    const opencbdcLedgerName = "OPENCBDC";

    let besuHtlcId = "";
    let besuHtlcStatus = 0;
    let parsecHtlcId = "";
    let parsecHtlcStatus = 0;
    let opencbdcHtlcId = "";
    let opencbdcHtlcStatus = 0;

    let balance = 0;
    let secretEthAbiEncoded = "";

    let localSecret = "";
    let foreignSecret = "";

    let localHashLock = "";
    let foreignHashLock = "";

    let localExpiration = 0;
    let foreignExpiration = 0;

    // Amount for swap
    const LCBDCAmount = 100000000000;
    const FCBDCAmount = 100000000;

    // Besu
    let besuCBDCContractAddress = "";
    let besuDC1ContractAddress = "";
    let besuDemoHelpderContractAddress = "";
    let besuHashTimeLockContractAddress = "";
    let besuAllowanceAmount = 0;
    

    // Parsec
    let parsecCBDCContractAddress = "";
    let parsecDemoHelperContractAddress = "";
    let parsecHashTimeLockContractAddress = "";
    let parsecAllowanceAmount = 0;

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

    // Create Besu HTLC Coordinator API
    const htlcCoordinatorBesuApi = new HtlcCoordinatorBesuApi(config);

    /***********************************************************************/
    // Deploy Besu Contracts
    /***********************************************************************/
    log.info("Deploying Besu Contracts...");

    // Besu Key Id
    const besuKeyId = CryptoMaterial.keychains.besu.id;

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
    log.info("Besu Token Distribution Starting...");

    // Mint CBDC - Hana Bank
    params = [CryptoMaterial.demoApps.scenarioAB.besu.hana.address, LCBDCAmount];
    printMintSEND(log, besuLedgerName, BEFORE_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.hana.address, LCBDCAmount);
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_SEND,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "mint",
        CryptoMaterial.demoApps.besu.deploy.address, 
        CryptoMaterial.demoApps.besu.deploy.privateKey,
        params,
    );
    printMintSEND(log, besuLedgerName, AFTER_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.hana.address, LCBDCAmount);

    // Get Balance - Hana Bank
    params = [CryptoMaterial.demoApps.scenarioAB.besu.hana.address];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi,
        besuKeyId,
        BesuCBDCTokenJSON.contractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    printBalanceOfCALL(log, besuLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.hana.address, response.callOutput);

    /***********************************************************************/
    // Parsec Init
    /***********************************************************************/
    // Parsec Util
    const parsecUtil = new ParsecUtil();

    // Create Parsec API
    const parsecApi = new ParsecApi(config);

    // Create Parsec HTLC Coordinator API
    const htlcCoordinatorParsecApi = new HtlcCoordinatorParsecApi(config);

    /***********************************************************************/
    // Deploy Parsec Contracts
    /***********************************************************************/
    log.info("Deploying Parsec Contracts...");

    // Parsec Key Id
    const parsecKeyId = CryptoMaterial.keychains.parsec.id;

    // ParsecCBDCTokenJSON
    constructorArgs = [FCBDCAmount, "DOLLAR", "2", "FCBDC"];
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

    // await wait(10000);

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

    // await wait(10000);

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

    /***********************************************************************/
    // Parsec : Token Distribution
    /***********************************************************************/
    log.info("Parsec Token Distribution Starting...");

    // Transfer to BoA
    params = [CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, FCBDCAmount];
    printTransferSEND(log, parsecLedgerName, BEFORE_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.parsec.deploy.address, CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, FCBDCAmount);
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_SEND,
        parsecApi,
        parsecKeyId,
        ParsecCBDCTokenJSON.contractName,
        "transfer",
        CryptoMaterial.demoApps.parsec.deploy.address,
        CryptoMaterial.demoApps.parsec.deploy.privateKey,
        params,
    );
    printTransferSEND(log, parsecLedgerName, AFTER_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.parsec.deploy.address, CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, FCBDCAmount);

    // Get Balance - BoA
    params = [CryptoMaterial.demoApps.scenarioAB.parsec.boa.address];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi,
        parsecKeyId,
        ParsecCBDCTokenJSON.contractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    printBalanceOfCALL(log, parsecLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, response.callOutput);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    log.info("");
    log.info("###########################################################################");
    log.info("BoK HTLC Scenario AB - Initialization");
    log.info("###########################################################################");
    
    log.info("");
    log.info("[ I - 1 ] : 통화스왑 계약 시작 - Hana Bank가 Local Intermediary의 Hana Bank 계좌로 1000억원 escrow");
    log.info("");
    // Transfer LCBDC - Hana Bank -> Local Inter(Hana Bank)
    params = [CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount];
    printTransferSEND(log, besuLedgerName, BEFORE_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount);
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_SEND,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "transfer",
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address, 
        CryptoMaterial.demoApps.scenarioAB.besu.hana.privateKey, 
        params,
    );
    printTransferSEND(log, besuLedgerName, AFTER_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    log.info("");
    log.info("[ I - 2 ] : 통화스왑 계약 시작 - BoA가 Foreign Intermediary의 BoA 계좌로 1억달러 escrow");
    log.info("");
    // Transfer FCBDC - BoA -> Foreign Inter(BoA)
    params = [CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount];
    printTransferSEND(log, parsecLedgerName, BEFORE_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount);
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_SEND,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON.contractName,
        "transfer",
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, 
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.privateKey, 
        params,
    );
    printTransferSEND(log, parsecLedgerName, AFTER_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    log.info("");
    log.info("###########################################################################");
    log.info("BoK HTLC Scenario A - Start");
    log.info("###########################################################################");

    log.info("");
    log.info("[ A - 1 ] : BoA가 달러 통화 스왑 HTLC 거래 생성");
    log.info("");
    // Approve to HTLC Contract : Foreign Inter(BoA) -> HTLC Contract
    params = [parsecHashTimeLockContractAddress, FCBDCAmount];
    printApproveSEND(log, parsecLedgerName, BEFORE_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, parsecHashTimeLockContractAddress, FCBDCAmount);
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_SEND,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON.contractName,
        "approve",
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, 
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.privateKey, 
        params,
    );
    printApproveSEND(log, parsecLedgerName, AFTER_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, parsecHashTimeLockContractAddress, FCBDCAmount);

    // Check Allowance of HTLC Contract : Foreign Inter(BoA) -> HTLC Contract
    params = [CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, parsecHashTimeLockContractAddress];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON.contractName,
        "allowance",
        undefined, 
        undefined, 
        params,
    );
    parsecAllowanceAmount = response.callOutput;
    printAllowanceCALL(log, parsecLedgerName, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, parsecHashTimeLockContractAddress, parsecAllowanceAmount);

    // Create HTLC Contract : Foreign Inter(BoA) -> Foreign Inter(Hana Bank), Secret, 2T
    foreignSecret = "0x1122334455667788112233445566778811223344556677881122334455667788";
    secretEthAbiEncoded = encodeParameter("uint256", foreignSecret);
    foreignHashLock = keccak256(secretEthAbiEncoded);
    // TO-DO : Calculate the expiration time - 2T
    foreignExpiration = 2147483648;
    printOwnHtlcSEND(log, parsecLedgerName, BEFORE_SEND, ParsecHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignHashLock, foreignExpiration);
    response = await parsecUtil.ownParsecHtlc(
        log,
        htlcCoordinatorParsecApi,
        CryptoMaterial.ledger.parsec.id,
        parsecKeyId,
        parsecHashTimeLockContractAddress,
        foreignHashLock,
        FCBDCAmount,
        LCBDCAmount,
        foreignExpiration,
        parsecCBDCContractAddress,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.privateKey,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        localOutputNetwork,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
    );
    printOwnHtlcSEND(log, parsecLedgerName, AFTER_SEND, ParsecHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignHashLock, foreignExpiration);
    
    log.info("");
    log.info("[ A - 2 ] : 하나은행이 달러 통화 스왑 HTLC 거래정보 검증");
    log.info("");
    // Get HTLC ID
    params = [
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, 
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        FCBDCAmount,
        foreignHashLock,
        foreignExpiration,
        parsecCBDCContractAddress,
    ];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi, 
        parsecKeyId, 
        ParsecDemoHelperJSON.contractName,
        "getTxId",
        undefined, 
        undefined, 
        params,
    );
    parsecHtlcId = response.callOutput;
    printGetTxIdCALL(log, parsecLedgerName, ParsecDemoHelperJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignHashLock, foreignExpiration, parsecCBDCContractAddress, parsecHtlcId);

    // // Check HTLC status by HTLC ID
    // response = await parsecUtil.counterpartyParsecHtlc(
    //     log,
    //     htlcCoordinatorParsecApi,
    //     CryptoMaterial.ledger.parsec.id,
    //     parsecKeyId,
    //     parsecHtlcId,
    //     undefined,
    //     undefined,
    // );
    // parsecHtlcStatus = response.callOutput;
    // printCounterpartyHtlcCALL(log, parsecLedgerName, ParsecHashTimeLockJSON.contractName, parsecHtlcId, parsecHtlcStatus);

    // // Check Ballance of Foreign Inter(BoA)
    // params = [CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address];
    // response = await parsecUtil.invokeParsecContracts(
    //     log,
    //     INVOCATION_TYPE_CALL,
    //     parsecApi,
    //     parsecKeyId,
    //     ParsecCBDCTokenJSON.contractName,
    //     "balanceOf",
    //     undefined,
    //     undefined,
    //     params,
    // );
    // balance = response.callOutput;
    // printBalanceOfCALL(log, parsecLedgerName, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, balance);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignExpiration);
    
    log.info("");
    log.info("[ A - 3 ] : 하나은행이 원화 통화 스왑 HTLC 거래 생성");
    log.info("");
    // Approve to HTLC Contract : Local Inter(Hana Bank) -> HTLC Contract
    params = [besuHashTimeLockContractAddress, LCBDCAmount];
    printApproveSEND(log, besuLedgerName, BEFORE_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, besuHashTimeLockContractAddress, LCBDCAmount);
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_SEND,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "approve",
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, 
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.privateKey, 
        params,
    );
    printApproveSEND(log, besuLedgerName, AFTER_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, besuHashTimeLockContractAddress, LCBDCAmount);

    // Check Allowance of HTLC Contract : Local Inter(Hana Bank) -> HTLC Contract
    params = [CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, besuHashTimeLockContractAddress];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "allowance",
        undefined, 
        undefined, 
        params,
    );
    besuAllowanceAmount = response.callOutput;
    printAllowanceCALL(log, besuLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, besuHashTimeLockContractAddress, besuAllowanceAmount);

    // Create HTLC Contract : Local Inter(Hana Bank) -> Local Inter(BoA), Secret, T
    // TO-DO : Calculate the expiration time - T
    localExpiration = 2047483648;
    printOwnHtlcSEND(log, besuLedgerName, BEFORE_SEND, BesuHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, foreignHashLock, localExpiration);
    response = await besuUtil.ownBesuHtlc(
        log,
        htlcCoordinatorBesuApi,
        CryptoMaterial.ledger.besu.id,
        besuKeyId,
        besuHashTimeLockContractAddress,
        foreignHashLock,
        LCBDCAmount,
        FCBDCAmount,
        localExpiration,
        besuCBDCContractAddress,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.privateKey,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        foreignOutputNetwork,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
    );
    printOwnHtlcSEND(log, besuLedgerName, AFTER_SEND, BesuHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, foreignHashLock, localExpiration);
    
    // TO-DO: Listen for the Secret...
    
    log.info("");
    log.info("[ A - 4 ] : BoA가 원화 통화 스왑 HTLC 거래정보 검증");
    log.info("");
    // Get HTLC ID
    params = [
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, 
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        LCBDCAmount,
        foreignHashLock,
        localExpiration,
        besuCBDCContractAddress,
    ];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi, 
        besuKeyId, 
        BesuDemoHelperJSON.contractName,
        "getTxId",
        undefined, 
        undefined, 
        params,
    );
    besuHtlcId = response.callOutput;
    printGetTxIdCALL(log, besuLedgerName, BesuDemoHelperJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, foreignHashLock, localExpiration, besuCBDCContractAddress, besuHtlcId);

    // // Check HTLC status by HTLC ID
    // response = await besuUtil.counterpartyBesuHtlc(
    //     log,
    //     htlcCoordinatorBesuApi,
    //     CryptoMaterial.ledger.besu.id,
    //     besuKeyId,
    //     besuHtlcId,
    //     undefined,
    //     undefined,
    // );
    // besuHtlcStatus = response.callOutput;
    // printCounterpartyHtlcCALL(log, besuLedgerName, BesuHashTimeLockJSON.contractName, besuHtlcId, besuHtlcStatus);

    // // Check Ballance of Local Inter(Hana Bank)
    // params = [CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address];
    // response = await besuUtil.invokeBesuContracts(
    //     log,
    //     INVOCATION_TYPE_CALL,
    //     besuApi,
    //     besuKeyId,
    //     BesuCBDCTokenJSON.contractName,
    //     "balanceOf",
    //     undefined,
    //     undefined,
    //     params,
    // );
    // balance = response.callOutput;
    // printBalanceOfCALL(log, besuLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, balance);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignExpiration);

    log.info("");
    log.info("[ A - 5 ] : BoA가 원화 자산 Withdraw");
    log.info("");
    // withdraw counterparty : Local Inter(Hana Bank) -> Local Inter(BoA) by BoA
    printWithdrawCounterpartySEND(log, besuLedgerName, BEFORE_SEND, BesuHashTimeLockJSON.contractName, besuHtlcId, foreignSecret, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address);
    response = await besuUtil.withdrawBesuCounterpary(
        log,
        htlcCoordinatorBesuApi,
        CryptoMaterial.ledger.besu.id,
        besuKeyId,
        besuHtlcId,
        foreignSecret,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.privateKey,
    );
    printWithdrawCounterpartySEND(log, besuLedgerName, AFTER_SEND, BesuHashTimeLockJSON.contractName, besuHtlcId, foreignSecret, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignExpiration);

    log.info("");
    log.info("[ A - 6 ] : 하나은행이 달러 자산 Withdraw");
    log.info("");
    // withdraw counterparty : Foreign Inter(BoA) -> Foreign Inter(Hana Bank) by Hana Bank
    // TO-DO: Listen for the secret... and use it...
    printWithdrawCounterpartySEND(log, parsecLedgerName, BEFORE_SEND, ParsecHashTimeLockJSON.contractName, parsecHtlcId, foreignSecret, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address);
    response = await parsecUtil.withdrawParsecCounterparty(
        log,
        htlcCoordinatorParsecApi,
        CryptoMaterial.ledger.parsec.id,
        parsecKeyId,
        parsecHtlcId,
        foreignSecret,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.privateKey,
    );
    printWithdrawCounterpartySEND(log, parsecLedgerName, AFTER_SEND, ParsecHashTimeLockJSON.contractName, parsecHtlcId, foreignSecret, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, foreignHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, FCBDCAmount, foreignExpiration);

    log.info("");
    log.info("###########################################################################");
    log.info("BoK HTLC Scenario B - Start");
    log.info("###########################################################################");
    
    log.info("");
    log.info("[ B - 1 ] : BoA가 원화 통화 스왑 HTLC 거래 생성");
    log.info("");
    // Approve to HTLC Contract : Local Inter(BoA) -> HTLC Contract
    params = [besuHashTimeLockContractAddress, LCBDCAmount];
    printApproveSEND(log, besuLedgerName, BEFORE_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, besuHashTimeLockContractAddress, LCBDCAmount);
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_SEND,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "approve",
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, 
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.privateKey, 
        params,
    );
    printApproveSEND(log, besuLedgerName, AFTER_SEND, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, besuHashTimeLockContractAddress, LCBDCAmount);

    // Check Allowance of HTLC Contract : Local Inter(BoA) -> HTLC Contract
    params = [CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, besuHashTimeLockContractAddress];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi, 
        besuKeyId, 
        BesuCBDCTokenJSON.contractName,
        "allowance",
        undefined, 
        undefined, 
        params,
    );
    besuAllowanceAmount = response.callOutput;
    printAllowanceCALL(log, besuLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, besuHashTimeLockContractAddress, besuAllowanceAmount);

    // Create HTLC Contract : Local Inter(BoA) -> Local Inter(Hana Bank), Secret, 2T
    localSecret = "0x8877665544332211887766554433221188776655443322118877665544332211";
    secretEthAbiEncoded = encodeParameter("uint256", localSecret);
    localHashLock = keccak256(secretEthAbiEncoded);
    // TO-DO : Calculate the expiration time - 2T
    localExpiration = 2247483648;
    printOwnHtlcSEND(log, besuLedgerName, BEFORE_SEND, BesuHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localHashLock, localExpiration);
    response = await besuUtil.ownBesuHtlc(
        log,
        htlcCoordinatorBesuApi,
        CryptoMaterial.ledger.besu.id,
        besuKeyId,
        besuHashTimeLockContractAddress,
        localHashLock,
        LCBDCAmount,
        FCBDCAmount,
        localExpiration,
        besuCBDCContractAddress,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.privateKey,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        foreignOutputNetwork,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
    );
    printOwnHtlcSEND(log, besuLedgerName, AFTER_SEND, BesuHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localHashLock, localExpiration);
    
    log.info("");
    log.info("[ B - 2 ] : 하나은행이 원화 통화 스왑 HTLC 거래정보 검증");
    log.info("");
    // Get HTLC ID
    params = [
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, 
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        LCBDCAmount,
        localHashLock,
        localExpiration,
        besuCBDCContractAddress,
    ];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi, 
        besuKeyId, 
        BesuDemoHelperJSON.contractName,
        "getTxId",
        undefined, 
        undefined, 
        params,
    );
    besuHtlcId = response.callOutput;
    printGetTxIdCALL(log, besuLedgerName, BesuDemoHelperJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localHashLock, localExpiration, besuCBDCContractAddress, besuHtlcId);

    // // Check HTLC status by HTLC ID
    // response = await besuUtil.counterpartyBesuHtlc(
    //     log,
    //     htlcCoordinatorBesuApi,
    //     CryptoMaterial.ledger.besu.id,
    //     besuKeyId,
    //     besuHtlcId,
    //     undefined,
    //     undefined,
    // );
    // besuHtlcStatus = response.callOutput;
    // printCounterpartyHtlcCALL(log, besuLedgerName, BesuHashTimeLockJSON.contractName, besuHtlcId, besuHtlcStatus);

    // // Check Ballance of Local Inter(BoA)
    // params = [CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address];
    // response = await besuUtil.invokeBesuContracts(
    //     log,
    //     INVOCATION_TYPE_CALL,
    //     besuApi,
    //     besuKeyId,
    //     BesuCBDCTokenJSON.contractName,
    //     "balanceOf",
    //     undefined,
    //     undefined,
    //     params,
    // );
    // balance = response.callOutput;
    // printBalanceOfCALL(log, besuLedgerName, BesuCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, balance);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localExpiration,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);

    log.info("");
    log.info("[ B - 3 ] : 하나은행이 달러 통화 스왑 HTLC 거래 생성");
    log.info("");
    // Approve to HTLC Contract : Foreign Inter(Hana Bank) -> HTLC Contract
    params = [parsecHashTimeLockContractAddress, FCBDCAmount];
    printApproveSEND(log, parsecLedgerName, BEFORE_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, parsecHashTimeLockContractAddress, FCBDCAmount);
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_SEND,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON.contractName,
        "approve",
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, 
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.privateKey, 
        params,
    );
    printApproveSEND(log, parsecLedgerName, AFTER_SEND, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, parsecHashTimeLockContractAddress, FCBDCAmount);

    // Check Allowance of HTLC Contract : Foreign Inter(Hana Bank) -> HTLC Contract
    params = [CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, parsecHashTimeLockContractAddress];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi, 
        parsecKeyId, 
        ParsecCBDCTokenJSON.contractName,
        "allowance",
        undefined, 
        undefined, 
        params,
    );
    parsecAllowanceAmount = response.callOutput;
    printAllowanceCALL(log, parsecLedgerName, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, parsecHashTimeLockContractAddress, parsecAllowanceAmount);

    // Create HTLC Contract : Foreign Inter(Hana Bank) -> Foreign Inter(BoA), Secret, T
    // TO-DO : Calculate the expiration time - T
    foreignExpiration = 2147483648;
    printOwnHtlcSEND(log, parsecLedgerName, BEFORE_SEND, ParsecHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, localHashLock, foreignExpiration);
    response = await parsecUtil.ownParsecHtlc(
        log,
        htlcCoordinatorParsecApi,
        CryptoMaterial.ledger.parsec.id,
        parsecKeyId,
        parsecHashTimeLockContractAddress,
        localHashLock,
        FCBDCAmount,
        LCBDCAmount,
        foreignExpiration,
        parsecCBDCContractAddress,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.privateKey,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        localOutputNetwork,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
    );
    printOwnHtlcSEND(log, parsecLedgerName, AFTER_SEND, ParsecHashTimeLockJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, localHashLock, foreignExpiration);
    
    // TO-DO: Listen for the Secret...

    log.info("");
    log.info("[ B - 4 ] : BoA가 달러 통화 스왑 HTLC 거래정보 검증");
    log.info("");
    // Get HTLC ID
    params = [
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, 
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        FCBDCAmount,
        localHashLock,
        foreignExpiration,
        parsecCBDCContractAddress,
    ];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi, 
        parsecKeyId, 
        ParsecDemoHelperJSON.contractName,
        "getTxId",
        undefined, 
        undefined, 
        params,
    );
    parsecHtlcId = response.callOutput;
    printGetTxIdCALL(log, parsecLedgerName, ParsecDemoHelperJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, localHashLock, foreignExpiration, parsecCBDCContractAddress, parsecHtlcId);

    // // Check HTLC status by HTLC ID
    // response = await parsecUtil.counterpartyParsecHtlc(
    //     log,
    //     htlcCoordinatorParsecApi,
    //     CryptoMaterial.ledger.parsec.id,
    //     parsecKeyId,
    //     parsecHtlcId,
    //     undefined,
    //     undefined,
    // );
    // parsecHtlcStatus = response.callOutput;
    // printCounterpartyHtlcCALL(log, parsecLedgerName, ParsecHashTimeLockJSON.contractName, parsecHtlcId, parsecHtlcStatus);

    // // Check Ballance of Foreign Inter(BoA)
    // params = [CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address];
    // response = await parsecUtil.invokeParsecContracts(
    //     log,
    //     INVOCATION_TYPE_CALL,
    //     parsecApi,
    //     parsecKeyId,
    //     ParsecCBDCTokenJSON.contractName,
    //     "balanceOf",
    //     undefined,
    //     undefined,
    //     params,
    // );
    // balance = response.callOutput;
    // printBalanceOfCALL(log, parsecLedgerName, ParsecCBDCTokenJSON.contractName, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, balance);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );
    
    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, foreignExpiration);

    log.info("");
    log.info("[ B - 5 ] : BoA가 달러 자산 Withdraw");
    log.info("");
    // withdraw counterparty : Foreign Inter(Hana Bank) -> Foreign Inter(BoA) by BoA
    printWithdrawCounterpartySEND(log, parsecLedgerName, BEFORE_SEND, ParsecHashTimeLockJSON.contractName, parsecHtlcId, localSecret, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address);
    response = await parsecUtil.withdrawParsecCounterparty(
        log,
        htlcCoordinatorParsecApi,
        CryptoMaterial.ledger.parsec.id,
        parsecKeyId,
        parsecHtlcId,
        localSecret,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.privateKey,
    );
    printWithdrawCounterpartySEND(log, parsecLedgerName, AFTER_SEND, ParsecHashTimeLockJSON.contractName, parsecHtlcId, localSecret, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, foreignExpiration);

    log.info("");
    log.info("[ B - 6 ] : 하나은행이 원화 자산 Withdraw");
    log.info("");
    // withdraw counterparty : Local Inter(BoA) -> Local Inter(Hana Bank) by Hana Bank
    // TO-DO: Listen for the secret... and use it...
    printWithdrawCounterpartySEND(log, besuLedgerName, BEFORE_SEND, BesuHashTimeLockJSON.contractName, besuHtlcId, localSecret, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address);
    response = await besuUtil.withdrawBesuCounterpary(
        log,
        htlcCoordinatorBesuApi,
        CryptoMaterial.ledger.besu.id,
        besuKeyId,
        besuHtlcId,
        localSecret,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.privateKey,
    );
    printWithdrawCounterpartySEND(log, besuLedgerName, AFTER_SEND, BesuHashTimeLockJSON.contractName, besuHtlcId, localSecret, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address);

    // Print all scenario-related balances
    await printAllBalancesFromScenarioAB(
        log,
        besuKeyId,
        besuApi,
        besuUtil,
        BesuCBDCTokenJSON.contractName,
        besuLedgerName,
        parsecKeyId,
        parsecApi,
        parsecUtil,
        ParsecCBDCTokenJSON.contractName,
        parsecLedgerName,
        CryptoMaterial.demoApps.scenarioAB.besu.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address,
        CryptoMaterial.demoApps.scenarioAB.parsec.boa.address,
    );

    // Print htlc-related information
    await printAllHtlcStatus(log, besuKeyId, htlcCoordinatorBesuApi, besuUtil, CryptoMaterial.ledger.besu.id, besuLedgerName, besuHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address, CryptoMaterial.demoApps.scenarioAB.besu.localInter.hana.address, LCBDCAmount, localExpiration,
        parsecKeyId, htlcCoordinatorParsecApi, parsecUtil, CryptoMaterial.ledger.parsec.id, parsecLedgerName, parsecHtlcId, localHashLock, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.hana.address, CryptoMaterial.demoApps.scenarioAB.parsec.foreignInter.boa.address, FCBDCAmount, foreignExpiration);
}

function printMintSEND(log: Logger, ledgerName: string, process: string, contractName: string, to: string, amount: number){
    log.info("[ " + ledgerName + " ][ MINT-" + process + " ] ( " + contractName + " ) - to : " + to + ", amount : " + amount);
}

function printTransferSEND(log: Logger, ledgerName: string, process: string, contractName: string, from: string, to: string, amount: number){
    log.info("[ " + ledgerName + " ][ TRANSFER-" + process + " ] ( " + contractName + " ) - from : " + from + ", to : " + to + ", amount : " + amount);
}

function printApproveSEND(log: Logger, ledgerName: string, process: string, contractName: string, from: string, to: string, amount: number){
    log.info("[ " + ledgerName + " ][ APPROVE-" + process + " ] ( " + contractName + " ) - from : " + from + ", to : " + to + ", amount : " + amount);
}

function printOwnHtlcSEND(log: Logger, ledgerName: string, process: string, contractName: string, from: string, to: string, amount: number, hashLock: string, expiration: number){
    log.info("[ " + ledgerName + " ][ OWN_HTLC-" + process + " ] ( " + contractName + " ) - from : " + from + ", to : " + to + ", amount : " + amount + ", hashLock : " + hashLock + ", expiration : " + expiration);
}

function printWithdrawCounterpartySEND(log: Logger, ledgerName: string, process: string, contractName: string, htlcId: string, secret: string, by: string){
    log.info("[ " + ledgerName + " ][ WITHDRAW_COUNTERPARTY-" + process + " ] ( " + contractName + " ) - htlcId : " + htlcId + ", secret : " + secret + ", by : " + by);
}

function printBalanceOfCALL(log: Logger, ledgerName: string, contractName: string, of: string, amount: number){
    log.info("[ " + ledgerName + " ][ BALANCE ] ( " + contractName + " ) - of : " + of + ", amount : " + amount);
}

function printAllowanceCALL(log: Logger, ledgerName: string, contractName: string, from: string, to: string, amount: number){
    log.info("[ " + ledgerName + " ][ ALLOWANCE ] ( " + contractName + " ) - from : " + from + ", to : " + to + ", amount : " + amount);
}

function printCounterpartyHtlcCALL(log: Logger, ledgerName: string, contractName: string, htlcId: string, htlcStatus: number){
    log.info("[ " + ledgerName + " ][ COUNTERPARTY_HTLC ] ( " + contractName + " ) - htlcId : " + htlcId + ", htlcStatus : " + getHtlcStatus(htlcStatus));
}

function printGetTxIdCALL(log: Logger, ledgerName: string, contractName: string, from: string, to: string, amount: number, hashLock: string, expiration: number, tokenAddress: string, txId: string){
    log.info("[ " + ledgerName + " ][ GET_HTLC_ID ] ( " + contractName + " ) - from : " + from + ", to : " + to + ", amount : " + amount + ", hashLock : " + hashLock + ", expiration : " + expiration + ", tokenAddress : " + tokenAddress + ", txId : " + txId);
}

function getHtlcStatus(htlcStatus: number): string {

    let htlcStatusName = "";
    
    switch(Number(htlcStatus)){
        case 0 :{htlcStatusName = "INVALID"; break;}                                             // Uninitialized  swap -> can go to ACTIVE
        case 1 :{htlcStatusName = "ACTIVE"; break;}                                              // Active swap -> can go to WITHDRAWN or EXPIRED
        case 2 :{htlcStatusName = "REFUNDED"; break;}                                            // Swap is refunded -> final state.
        case 3 :{htlcStatusName = "WITHDRAWN"; break;}                                           // Swap is withdrawn -> final state.
        case 4 :{htlcStatusName = "EXPIRED"; break;}                                             // Swap is expired -> can go to REFUNDED
        default :{htlcStatusName = "UNKNOWN"; log.error("htlcStatus : " + htlcStatus); break;}   // Something wrong...
    }

    return htlcStatusName;
}

async function printAllHtlcStatus(
    log: Logger,
    besuKeyId?: string, 
    besuApi?: HtlcCoordinatorBesuApi,
    besuUtil?: BesuUtil,
    besuConnectorInstanceId?: string,
    besuLedgerName?: string,
    besuHtlcId?: string,
    besuHashLock?: string,
    besuHtlcFromAddress?: string,
    besuHtlcToAddress?: string,
    besuHtlcAmount?: number,
    besuHtlcExpiration?: number,
    parsecKeyId?: string,
    parsecApi?: HtlcCoordinatorParsecApi,
    parsecUtil?: ParsecUtil,
    parsecConnectorInstanceId?: string,
    parsecLedgerName?: string,
    parsecHtlcId?: string,
    parsecHashLock?: string,
    parsecHtlcFromAddress?: string,
    parsecHtlcToAddress?: string,
    parsecHtlcAmount?: number,
    parsecHtlcExpiration?: number,
){
    let besuHtlcStatusName = "";

    if(besuKeyId !== undefined){
        
        // Check HTLC status by HTLC ID
        let response = await besuUtil!.counterpartyBesuHtlc(
            log,
            besuApi!,
            besuConnectorInstanceId!,
            besuKeyId,
            besuHtlcId!,
            undefined,
            undefined,
        );
        let besuHtlcStatus = response.callOutput;
        besuHtlcStatusName = getHtlcStatus(besuHtlcStatus);
    }

    let parsecHtlcStatusName = "";

    if(parsecKeyId !== undefined){

        // Check HTLC status by HTLC ID
        let response = await parsecUtil!.counterpartyParsecHtlc(
            log,
            parsecApi!,
            parsecConnectorInstanceId!,
            parsecKeyId,
            parsecHtlcId!,
            undefined,
            undefined,
        );
        let parsecHtlcStatus = response.callOutput;
        parsecHtlcStatusName = getHtlcStatus(parsecHtlcStatus);
    }

    if(besuKeyId !== undefined && parsecKeyId !== undefined){
        const allHtlcStatus = {
            Besu_HTLC: {
                HTLC_ID: besuHtlcId,
                FROM: besuHtlcFromAddress,
                TO: besuHtlcToAddress,
                AMOUNT: besuHtlcAmount + " (₩)",
                HASH_LOCK: besuHashLock,
                EXPIRATION: besuHtlcExpiration,
                STATUS: besuHtlcStatusName,
            },
            Parsec_HTLC: {
                HTLC_ID: parsecHtlcId,
                FROM: parsecHtlcFromAddress,
                TO: parsecHtlcToAddress,
                AMOUNT: parsecHtlcAmount + " ($)",
                HASH_LOCK: parsecHashLock,
                EXPIRATION: parsecHtlcExpiration,
                STATUS: parsecHtlcStatusName,
            }
        };
    
        console.table(allHtlcStatus);
    }
    else if(besuKeyId === undefined) {
        const allHtlcStatus = {
            Parsec_HTLC: {
                HTLC_ID: parsecHtlcId,
                FROM: parsecHtlcFromAddress,
                TO: parsecHtlcToAddress,
                AMOUNT: parsecHtlcAmount + " ($)",
                HASH_LOCK: parsecHashLock,
                EXPIRATION: parsecHtlcExpiration,
                STATUS: parsecHtlcStatusName,
            }
        };
    
        console.table(allHtlcStatus);
    }
    else{
        const allHtlcStatus = {
            Besu_HTLC: {
                HTLC_ID: besuHtlcId,
                FROM: besuHtlcFromAddress,
                TO: besuHtlcToAddress,
                AMOUNT: besuHtlcAmount + " (₩)",
                HASH_LOCK: besuHashLock,
                EXPIRATION: besuHtlcExpiration,
                STATUS: besuHtlcStatusName,
            }
        };
    
        console.table(allHtlcStatus);
    }
}

async function printAllBalancesFromScenarioAB(
    log: Logger, 
    besuKeyId: string, 
    besuApi: BesuApi, 
    besuUtil: BesuUtil,
    lcbdcContractName: string,
    besuLedgerName: string,
    parsecKeyId: string,
    parsecApi: ParsecApi,
    parsecUtil: ParsecUtil,
    fcbdcContractName: string,
    parsecLedgerName: string,
    hanaBankBesuAddress: string,
    localInterHanaBankBesuAddress: string,
    localInterBoABesuAddress: string,
    foreignInterHanaBankParsecAddress: string,
    foreignInterBoAParsecAddress: string,
    boaParsecAddress: string
){
    let params = [];
    let response = undefined;

    // Hana Bank
    let hanaBankBesuBalance = 0;

    // Local Intermediary
    let localInterHanaBankBesuBalance = 0;
    let localInterBoABesuBalance = 0;

    // Foreign Intermediary
    let foreignInterBoAParsecBalance = 0;
    let foreignInterHanaBankParsecBalance = 0;

    // BoA
    let boaParsecBalance = 0;

    // Get Balances
    params = [hanaBankBesuAddress];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi,
        besuKeyId,
        lcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    hanaBankBesuBalance = response.callOutput;
    printBalanceOfCALL(log, besuLedgerName, lcbdcContractName, hanaBankBesuAddress, hanaBankBesuBalance);

    params = [localInterHanaBankBesuAddress];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi,
        besuKeyId,
        lcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    localInterHanaBankBesuBalance = response.callOutput;
    printBalanceOfCALL(log, besuLedgerName, lcbdcContractName, localInterHanaBankBesuAddress, localInterHanaBankBesuBalance);

    params = [localInterBoABesuAddress];
    response = await besuUtil.invokeBesuContracts(
        log,
        INVOCATION_TYPE_CALL,
        besuApi,
        besuKeyId,
        lcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    localInterBoABesuBalance = response.callOutput;
    printBalanceOfCALL(log, besuLedgerName, lcbdcContractName, localInterBoABesuAddress, localInterBoABesuBalance);

    params = [foreignInterHanaBankParsecAddress];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi,
        parsecKeyId,
        fcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    foreignInterHanaBankParsecBalance = response.callOutput;
    printBalanceOfCALL(log, parsecLedgerName, fcbdcContractName, foreignInterHanaBankParsecAddress, foreignInterHanaBankParsecBalance);

    params = [foreignInterBoAParsecAddress];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi,
        parsecKeyId,
        fcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    foreignInterBoAParsecBalance = response.callOutput;
    printBalanceOfCALL(log, parsecLedgerName, fcbdcContractName, foreignInterBoAParsecAddress, foreignInterBoAParsecBalance);
    
    params = [boaParsecAddress];
    response = await parsecUtil.invokeParsecContracts(
        log,
        INVOCATION_TYPE_CALL,
        parsecApi,
        parsecKeyId,
        fcbdcContractName,
        "balanceOf",
        undefined,
        undefined,
        params,
    );
    boaParsecBalance = response.callOutput;
    printBalanceOfCALL(log, parsecLedgerName, fcbdcContractName, boaParsecAddress, boaParsecBalance);

    const allBalances = {
        Hana_bank: {
            address: hanaBankBesuAddress,
            balance: hanaBankBesuBalance + " (₩)",
        },
        Local_intermediary_Hana_bank: {
            address: localInterHanaBankBesuAddress,
            balance: localInterHanaBankBesuBalance + " (₩)",
        },
        Local_intermediary_BoA: {
            address: localInterBoABesuAddress,
            balance: localInterBoABesuBalance + " (₩)",
        },
        Foreign_intermediary_Hana_bank: {
            address: foreignInterHanaBankParsecAddress,
            balance: foreignInterHanaBankParsecBalance + " ($)",
        },
        Foreign_intermediary_BoA: {
            address: foreignInterBoAParsecAddress,
            balance: foreignInterBoAParsecBalance + " ($)",
        },
        BoA: {
            address: boaParsecAddress,
            balance: boaParsecBalance + " ($)",
        },
    };

    console.table(allBalances);
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
