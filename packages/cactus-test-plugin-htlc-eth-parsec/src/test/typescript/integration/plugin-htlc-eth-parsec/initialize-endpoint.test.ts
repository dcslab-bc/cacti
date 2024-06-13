import http from "http";
import "jest-extended";

import { v4 as uuidv4 } from "uuid";
import express from "express";
import bodyParser from "body-parser";
import {
  IPluginHtlcEthParsecOptions,
  PluginFactoryHtlcEthParsec,
  InitializeRequest,
} from "@hyperledger/cactus-plugin-htlc-eth-parsec";
import {
  PluginFactoryLedgerConnector,
  PluginLedgerConnectorParsec,
  Web3SigningCredential,
  Web3SigningCredentialType,
} from "@hyperledger/cactus-plugin-ledger-connector-parsec";
import {
  LogLevelDesc,
  IListenOptions,
  Servers,
} from "@hyperledger/cactus-common";
import { PluginRegistry } from "@hyperledger/cactus-core";
import { PluginImportType } from "@hyperledger/cactus-core-api";
import {
  ParsecTestLedger,
  pruneDockerAllIfGithubAction,
} from "@hyperledger/cactus-test-tooling";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { DataTest } from "../data-test";
import DemoHelperJSON from "../../../solidity/contracts/DemoHelpers.json";
import HashTimeLockJSON from "../../../../../../cactus-plugin-htlc-eth-parsec/src/main/solidity/contracts/HashTimeLock.json";

const connectorId = uuidv4();
const logLevel: LogLevelDesc = "INFO";
const testCase = "Test initialize";

describe(testCase, () => {
  const parsecTestLedger = new ParsecTestLedger({ logLevel });
  const expressApp = express();
  expressApp.use(bodyParser.json({ limit: "250mb" }));
  const server = http.createServer(expressApp);
  const listenOptions: IListenOptions = {
    hostname: "127.0.0.1",
    port: 0,
    server,
  };
  beforeAll(async () => {
    const pruning = pruneDockerAllIfGithubAction({ logLevel });
    await expect(pruning).resolves.toBeTruthy();
  });

  beforeAll(async () => {
    await Servers.listen(listenOptions);
    await parsecTestLedger.start();
  });

  afterAll(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
    await pruneDockerAllIfGithubAction({ logLevel });
  });
  afterAll(async () => await Servers.shutdown(server));

  afterAll(async () => {
    const pruning = pruneDockerAllIfGithubAction({ logLevel });
    await expect(pruning).resolves.toBeTruthy();
  });
  test(testCase, async () => {
    const rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
    const rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();
    const firstHighNetWorthAccount = parsecTestLedger.getGenesisAccountPubKey();
    const privateKey = parsecTestLedger.getGenesisAccountPrivKey();
    const web3SigningCredential: Web3SigningCredential = {
      ethAccount: firstHighNetWorthAccount,
      secret: privateKey,
      type: Web3SigningCredentialType.PrivateKeyHex,
    } as Web3SigningCredential;

    const keychainId = uuidv4();
    const keychainPlugin = new PluginKeychainMemory({
      instanceId: uuidv4(),
      keychainId,
      // pre-provision keychain with mock backend holding the private key of the
      // test account that we'll reference while sending requests with the
      // signing credential pointing to this keychain entry.
      backend: new Map([
        [DemoHelperJSON.contractName, JSON.stringify(DemoHelperJSON)],
      ]),
      logLevel,
    });
    keychainPlugin.set(
      HashTimeLockJSON.contractName,
      JSON.stringify(HashTimeLockJSON),
    );

    const factory = new PluginFactoryLedgerConnector({
      pluginImportType: PluginImportType.Local,
    });

    const pluginRegistry = new PluginRegistry({});
    const connector: PluginLedgerConnectorParsec = await factory.create({
      rpcApiHttpHost,
      rpcApiWsHost,
      logLevel,
      instanceId: connectorId,
      pluginRegistry: new PluginRegistry({ plugins: [keychainPlugin] }),
    });

    pluginRegistry.add(connector);
    const pluginOptions: IPluginHtlcEthParsecOptions = {
      logLevel,
      instanceId: uuidv4(),
      pluginRegistry,
    };

    const factoryHTLC = new PluginFactoryHtlcEthParsec({
      pluginImportType: PluginImportType.Local,
    });

    const pluginHtlc = await factoryHTLC.create(pluginOptions);
    pluginRegistry.add(pluginHtlc);

    await pluginHtlc.getOrCreateWebServices();
    await pluginHtlc.registerWebServices(expressApp);
    const initRequest: InitializeRequest = {
      connectorId,
      keychainId,
      constructorArgs: [],
      web3SigningCredential,
      gas: DataTest.estimated_gas,
    };
    const deployOut = await pluginHtlc.initialize(initRequest);
    expect(deployOut.transactionReceipt).toBeTruthy();
    expect(deployOut.transactionReceipt.contractAddress).toBeTruthy();
  });
});
