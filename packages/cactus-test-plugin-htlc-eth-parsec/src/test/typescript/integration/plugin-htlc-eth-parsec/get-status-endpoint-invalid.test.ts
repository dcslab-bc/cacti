import http from "http";
import type { AddressInfo } from "net";
import "jest-extended";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import bodyParser from "body-parser";
import Web3 from "web3";
import {
  Configuration,
  DefaultApi as ParsecApi,
  IPluginHtlcEthParsecOptions,
  PluginFactoryHtlcEthParsec,
  NewContractObj,
  InitializeRequest,
} from "@hyperledger/cactus-plugin-htlc-eth-parsec";
import {
  EthContractInvocationType,
  PluginFactoryLedgerConnector,
  PluginLedgerConnectorParsec,
  Web3SigningCredential,
  Web3SigningCredentialType,
} from "@hyperledger/cactus-plugin-ledger-connector-parsec";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
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
import { DataTest } from "../data-test";
import DemoHelperJSON from "../../../solidity/contracts/DemoHelpers.json";
import HashTimeLockJSON from "../../../../../../cactus-plugin-htlc-eth-parsec/src/main/solidity/contracts/HashTimeLock.json";

const connectorId = uuidv4();
const logLevel: LogLevelDesc = "INFO";
const testCase = "Test get invalid status";
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

  afterAll(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
    await pruneDockerAllIfGithubAction({ logLevel });
  });

  beforeAll(async () => {
    await parsecTestLedger.start();
  });
  afterAll(async () => await Servers.shutdown(server));

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

    const addressInfo = (await Servers.listen(listenOptions)) as AddressInfo;
    const { address, port } = addressInfo;
    const apiHost = `http://${address}:${port}`;

    const configuration = new Configuration({ basePath: apiHost });
    const api = new ParsecApi(configuration);

    await pluginHtlc.getOrCreateWebServices();
    await pluginHtlc.registerWebServices(expressApp);

    const web3 = new Web3(rpcApiHttpHost);

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
    const hashTimeLockAddress = deployOut.transactionReceipt
      .contractAddress as string;

    //Deploy DemoHelpers
    const deployOutDemo = await connector.deployContract({
      contractName: DemoHelperJSON.contractName,
      contractAbi: DemoHelperJSON.abi,
      bytecode: DemoHelperJSON.bytecode,
      web3SigningCredential,
      keychainId,
      constructorArgs: [],
      gas: DataTest.estimated_gas,
    });
    expect(deployOutDemo).toBeTruthy();
    expect(deployOutDemo.transactionReceipt).toBeTruthy();
    expect(deployOutDemo.transactionReceipt.contractAddress).toBeTruthy();

    const balance = await web3.eth.getBalance(firstHighNetWorthAccount);
    const bodyObj: NewContractObj = {
      contractAddress: hashTimeLockAddress,
      inputAmount: 10,
      outputAmount: 0x04,
      expiration: DataTest.expiration,
      hashLock: DataTest.hashLock,
      receiver: DataTest.receiver,
      outputNetwork: "BTC",
      outputAddress: "1AcVYm7M3kkJQH28FXAvyBFQzFRL6xPKu8",
      connectorId: connectorId,
      web3SigningCredential,
      keychainId,
      gas: DataTest.estimated_gas,
    };
    const resp = await api.newContractV1(bodyObj);
    expect(resp).toBeTruthy();
    expect(resp.status).toEqual(200);

    const responseTxId = await connector.invokeContract({
      contractName: DemoHelperJSON.contractName,
      keychainId,
      signingCredential: web3SigningCredential,
      invocationType: EthContractInvocationType.Call,
      methodName: "getTxId",
      params: [
        firstHighNetWorthAccount,
        DataTest.receiver,
        10,
        DataTest.hashLock,
        DataTest.expiration,
      ],
    });
    const balance2 = await web3.eth.getBalance(firstHighNetWorthAccount);

    expect(parseInt(balance)).toEqual(parseInt(balance2) - 10);

    try {
      const ids = [responseTxId.callOutput as string];
      const res = await api.getStatusV1({
        ids,
        web3SigningCredential,
        connectorId,
        keychainId: "",
      });
      expect(res.status).toEqual(500);
    } catch (e: any) {
      expect(e.response.status).toEqual(500);
    }
  });
});
