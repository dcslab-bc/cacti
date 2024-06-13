import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import {
  Logger,
  Checks,
  LogLevelDesc,
  LoggerProvider,
} from "@hyperledger/cactus-common";
// import {
//   BesuTestLedger,
//   DEFAULT_FABRIC_2_AIO_IMAGE_NAME,
//   FABRIC_25_LTS_AIO_FABRIC_VERSION,
//   FABRIC_25_LTS_AIO_IMAGE_VERSION,
//   FABRIC_25_LTS_FABRIC_SAMPLES_ENV_INFO_ORG_1,
//   FABRIC_25_LTS_FABRIC_SAMPLES_ENV_INFO_ORG_2,
//   FabricTestLedgerV1,
// } from "@hyperledger/cactus-test-tooling";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import {
  DefaultApi as BesuApi,
  DeployContractSolidityBytecodeV1Request as DeployContractSolidityBytecodeV1RequestBesu,
  PluginFactoryLedgerConnector as PluginFactoryBesuLedgerConnector,
  PluginLedgerConnectorBesu,
  Web3SigningCredentialType as Web3SigningCredentialTypeBesu,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";
import {
  DefaultApi as ParsecApi,
  DeployContractSolidityBytecodeV1Request as DeployContractSolidityBytecodeV1RequestParsec,
  Web3SigningCredentialType as Web3SigningCredentialTypeParsec,
  PluginFactoryLedgerConnector as PluginFactoryParsecLedgerConnector,
  PluginLedgerConnectorParsec,
} from "@hyperledger/cactus-plugin-ledger-connector-parsec";
import { PluginRegistry } from "@hyperledger/cactus-core";
import { PluginImportType } from "@hyperledger/cactus-core-api";
import CryptoMaterial from "../../../crypto-material/crypto-material.json";

import ParsecHashTimeLockJSON from "../../solidity/parsec-cbdc/artifacts/contracts/HashedTimeLockContract.sol/HashedTimeLockContract.json";
import ParsecCBDCTokenJSON from "../../solidity/parsec-cbdc/artifacts/contracts/Token.sol/Test_Token.json";
import ParsecDemoHelperJSON from "../../solidity/parsec-cbdc/artifacts/contracts/DemoHelpers.sol/DemoHelpers.json";

import BesuCBDCTokenJSON from "../../solidity/bok-cbdc/artifacts/contracts/CBDCToken.sol/CBDCToken.json";
import BesuDC1TokenJSON from "../../solidity/bok-cbdc/artifacts/contracts/DC1Token.sol/DC1Token.json";
import BesuDemoHelperJSON from "../../solidity/bok-cbdc/artifacts/contracts/DemoHelpers.sol/DemoHelpers.json";
import BesuHashTimeLockJSON from "../../solidity/bok-cbdc/artifacts/contracts/HashedTimeLockContract.sol/HashedTimeLockContract.json";

export interface ICbdcHtlcInfrastructureOptions {
  logLevel?: LogLevelDesc;
}

export class CbdcHtlcInfrastructure {
  public static readonly CLASS_NAME = "CbdcHtlcInfrastructure";

  // private readonly besu: BesuTestLedger;
  private readonly log: Logger;

  public get className(): string {
    return CbdcHtlcInfrastructure.CLASS_NAME;
  }

  constructor(
    public readonly options: ICbdcHtlcInfrastructureOptions,
  ) {
    const fnTag = `${this.className}#constructor()`;
    Checks.truthy(options, `${fnTag} arg options`);

    const level = this.options.logLevel || "INFO";
    const label = this.className;

    this.log = LoggerProvider.getOrCreate({ level, label });

    // this.besu = new BesuTestLedger({
    //   logLevel: level || "DEBUG",
    //   emitContainerLogs: true,
    //   envVars: ["BESU_NETWORK=dev"],
    // });
  }

  public async createBesuLedgerConnector(): Promise<PluginLedgerConnectorBesu> {

    const rpcApiHttpHost = `http://${process.env.BESU_API_HOST}:${process.env.BESU_HTTP_RPC_PORT}`;
    const rpcApiWsHost = `ws://${process.env.BESU_API_HOST}:${process.env.BESU_WS_RPC_PORT}`;

    const keychainPlugin = new PluginKeychainMemory({
      instanceId: uuidv4(),
      keychainId: CryptoMaterial.keychains.keychain1.id,
      logLevel: undefined,
      backend: new Map([
        [BesuCBDCTokenJSON.contractName, JSON.stringify(BesuCBDCTokenJSON)],
        [BesuDC1TokenJSON.contractName, JSON.stringify(BesuDC1TokenJSON)],
        [BesuDemoHelperJSON.contractName, JSON.stringify(BesuDemoHelperJSON)],
        [BesuHashTimeLockJSON.contractName, JSON.stringify(BesuHashTimeLockJSON)],
      ]),
    });

    // keychainPlugin.set(
    //   DemoHelperJSON.contractName,
    //   JSON.stringify(DemoHelperJSON),
    // );
    // keychainPlugin.set(
    //   HashTimeLockJSON.contractName,
    //   JSON.stringify(HashTimeLockJSON),
    // );

    this.log.info(`Creating Besu Connector...`);
    const factory = new PluginFactoryBesuLedgerConnector({
      pluginImportType: PluginImportType.Local,
    });

    const besuConnector = await factory.create({
      rpcApiHttpHost,
      rpcApiWsHost,
      instanceId: uuidv4(),
      pluginRegistry: new PluginRegistry({ plugins: [keychainPlugin] }),
    });

    // const accounts = [
    //   CryptoMaterial.accounts.userA.ethAddress,
    //   CryptoMaterial.accounts.userB.ethAddress,
    //   CryptoMaterial.accounts.bridge.ethAddress,
    // ];

    // for (const account of accounts) {
    //   await this.besu.sendEthToAccount(account);
    // }

    return besuConnector;
  }

  public async deployBesuContracts(besuApiClient: BesuApi): Promise<void> {
    const fnTag = `${this.className}#deployBesuContracts()`;

    this.log.info(`Deploying Besu Contracts...`);

    const deployCbdcContractResponse =
      await besuApiClient.deployContractSolBytecodeV1({
        keychainId: CryptoMaterial.keychains.keychain1.id,
        contractName: BesuCBDCTokenJSON.contractName,
        contractAbi: BesuCBDCTokenJSON.abi,
        constructorArgs: [],
        web3SigningCredential: {
          ethAccount: CryptoMaterial.demoApps.besu.deploy.address,
          secret: CryptoMaterial.demoApps.besu.deploy.privateKey,
          type: Web3SigningCredentialTypeBesu.PrivateKeyHex,
        },
        bytecode: BesuCBDCTokenJSON.bytecode,
        gas: 10000000,
      } as DeployContractSolidityBytecodeV1RequestBesu);

    if (deployCbdcContractResponse == undefined) {
      throw new Error(`${fnTag}, error when deploying CBDC smart contract`);
    }
  }

  public async createParsecLedgerConnector(): Promise<PluginLedgerConnectorParsec> {

    const rpcApiHttpHost = `http://${process.env.PARSEC_API_HOST}:${process.env.PARSEC_HTTP_RPC_PORT}`;
    const rpcApiWsHost = `ws://${process.env.PARSEC_API_HOST}:${process.env.PARSEC_WS_RPC_PORT}`;

    const keychainPlugin = new PluginKeychainMemory({
      instanceId: uuidv4(),
      keychainId: CryptoMaterial.keychains.keychain2.id,
      logLevel: undefined,
      backend: new Map([
        [ParsecCBDCTokenJSON.contractName, JSON.stringify(ParsecCBDCTokenJSON)],
        [ParsecHashTimeLockJSON.contractName, JSON.stringify(ParsecHashTimeLockJSON)],
        [ParsecDemoHelperJSON.contractName, JSON.stringify(ParsecDemoHelperJSON)],
      ]),
    });

    // keychainPlugin.set(
    //   DemoHelperJSON.contractName,
    //   JSON.stringify(DemoHelperJSON),
    // );
    // keychainPlugin.set(
    //   HashTimeLockJSON.contractName,
    //   JSON.stringify(HashTimeLockJSON),
    // );

    this.log.info(`Creating Parsec Connector...`);
    const factory = new PluginFactoryParsecLedgerConnector({
      pluginImportType: PluginImportType.Local,
    });

    const parsecConnector = await factory.create({
      rpcApiHttpHost,
      rpcApiWsHost,
      instanceId: uuidv4(),
      pluginRegistry: new PluginRegistry({ plugins: [keychainPlugin] }),
    });

    // const accounts = [
    //   CryptoMaterial.accounts.userA.ethAddress,
    //   CryptoMaterial.accounts.userB.ethAddress,
    //   CryptoMaterial.accounts.bridge.ethAddress,
    // ];

    // for (const account of accounts) {
    //   await this.besu.sendEthToAccount(account);
    // }

    return parsecConnector;
  }

  // public async deployBesuContracts(besuApiClient: BesuApi): Promise<void> {
  //   const fnTag = `${this.className}#deployBesuContracts()`;

  //   const deployCbdcContractResponse =
  //     await besuApiClient.deployContractSolBytecodeV1({
  //       keychainId: CryptoMaterial.keychains.keychain2.id,
  //       contractName: CBDCcontractJson.contractName,
  //       contractAbi: CBDCcontractJson.abi,
  //       constructorArgs: [],
  //       web3SigningCredential: {
  //         ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
  //         secret: CryptoMaterial.accounts["bridge"].privateKey,
  //         type: Web3SigningCredentialType.PrivateKeyHex,
  //       },
  //       bytecode: CBDCcontractJson.bytecode,
  //       gas: 10000000,
  //     } as DeployContractSolidityBytecodeV1Request);

  //   if (deployCbdcContractResponse == undefined) {
  //     throw new Error(`${fnTag}, error when deploying CBDC smart contract`);
  //   }

  //   const deployAssetReferenceContractResponse =
  //     await besuApiClient.deployContractSolBytecodeV1({
  //       keychainId: CryptoMaterial.keychains.keychain2.id,
  //       contractName: AssetReferenceContractJson.contractName,
  //       contractAbi: AssetReferenceContractJson.abi,
  //       constructorArgs: [
  //         deployCbdcContractResponse.data.transactionReceipt.contractAddress,
  //       ],
  //       web3SigningCredential: {
  //         ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
  //         secret: CryptoMaterial.accounts["bridge"].privateKey,
  //         type: Web3SigningCredentialType.PrivateKeyHex,
  //       },
  //       bytecode: AssetReferenceContractJson.bytecode,
  //       gas: 10000000,
  //     } as DeployContractSolidityBytecodeV1Request);

  //   if (deployAssetReferenceContractResponse == undefined) {
  //     throw new Error(
  //       `${fnTag}, error when deploying Asset Reference smart contract`,
  //     );
  //   }

  //   // set Asset Reference smart contract address in cbdc one (sidechain contract)
  //   const insertARContractAddress = await besuApiClient.invokeContractV1({
  //     contractName: CBDCcontractJson.contractName,
  //     invocationType: EthContractInvocationType.Send,
  //     methodName: "setAssetReferenceContract",
  //     gas: 1000000,
  //     params: [
  //       deployAssetReferenceContractResponse.data.transactionReceipt
  //         .contractAddress,
  //     ],
  //     signingCredential: {
  //       ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
  //       secret: CryptoMaterial.accounts["bridge"].privateKey,
  //       type: Web3SigningCredentialType.PrivateKeyHex,
  //     },
  //     keychainId: CryptoMaterial.keychains.keychain2.id,
  //   } as BesuInvokeContractV1Request);

  //   if (insertARContractAddress == undefined) {
  //     throw new Error(
  //       `${fnTag}, error when setting Asset Reference smart contract address in sidechain contract`,
  //     );
  //   }

  //   // make the owner of the sidechain contract the asset reference one
  //   const transferOwnership = await besuApiClient.invokeContractV1({
  //     contractName: CBDCcontractJson.contractName,
  //     invocationType: EthContractInvocationType.Send,
  //     methodName: "transferOwnership",
  //     gas: 1000000,
  //     params: [
  //       deployAssetReferenceContractResponse.data.transactionReceipt
  //         .contractAddress,
  //     ],
  //     signingCredential: {
  //       ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
  //       secret: CryptoMaterial.accounts["bridge"].privateKey,
  //       type: Web3SigningCredentialType.PrivateKeyHex,
  //     },
  //     keychainId: CryptoMaterial.keychains.keychain2.id,
  //   } as BesuInvokeContractV1Request);

  //   if (transferOwnership == undefined) {
  //     throw new Error(
  //       `${fnTag}, error when transferring the ownershop Reference smart contract address in sidechain contract`,
  //     );
  //   }

  //   // make the owner of the asset reference contract the sidechain one
  //   const addOwnerToAssetRefContract = await besuApiClient.invokeContractV1({
  //     contractName: AssetReferenceContractJson.contractName,
  //     invocationType: EthContractInvocationType.Send,
  //     methodName: "addOwner",
  //     gas: 1000000,
  //     params: [
  //       deployCbdcContractResponse.data.transactionReceipt.contractAddress,
  //     ],
  //     signingCredential: {
  //       ethAccount: CryptoMaterial.accounts["bridge"].ethAddress,
  //       secret: CryptoMaterial.accounts["bridge"].privateKey,
  //       type: Web3SigningCredentialType.PrivateKeyHex,
  //     },
  //     keychainId: CryptoMaterial.keychains.keychain2.id,
  //   } as BesuInvokeContractV1Request);

  //   if (addOwnerToAssetRefContract == undefined) {
  //     throw new Error(
  //       `${fnTag}, error when transfering CBDC smart contract ownership`,
  //     );
  //   }
  // }
}
