import { v4 as uuidv4 } from "uuid";
import "jest-extended";
import { Account } from "web3-core";
import { PluginRegistry } from "@hyperledger/cactus-core";
import {
  PluginLedgerConnectorParsec,
  PluginFactoryLedgerConnector,
  GetBalanceV1Request,
} from "../../../../../main/typescript/public-api";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { ParsecTestLedger } from "@hyperledger/cactus-test-tooling";
import { LogLevelDesc } from "@hyperledger/cactus-common";
import HelloWorldContractJson from "../../../../solidity/hello-world-contract/HelloWorld.json";
import Web3 from "web3";
import { PluginImportType } from "@hyperledger/cactus-core-api";

const testcase = "can get balance of an account";
describe(testcase, () => {
  const logLevel: LogLevelDesc = "TRACE";
  const parsecTestLedger = new ParsecTestLedger();

  let rpcApiHttpHost: string,
    rpcApiWsHost: string,
    web3: Web3,
    keychainPlugin: PluginKeychainMemory,
    firstHighNetWorthAccount: string,
    testEthAccount: Account,
    keychainEntryKey: string,
    keychainEntryValue: string;

  afterAll(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
  });
  beforeAll(async () => {
    await parsecTestLedger.start();
    web3 = new Web3(rpcApiHttpHost);
    firstHighNetWorthAccount = parsecTestLedger.getGenesisAccountPubKey();
    testEthAccount = web3.eth.accounts.create(uuidv4());

    keychainEntryKey = uuidv4();
    keychainEntryValue = testEthAccount.privateKey;
    keychainPlugin = new PluginKeychainMemory({
      instanceId: uuidv4(),
      keychainId: uuidv4(),
      // pre-provision keychain with mock backend holding the private key of the
      // test account that we'll reference while sending requests with the
      // signing credential pointing to this keychain entry.
      backend: new Map([[keychainEntryKey, keychainEntryValue]]),
      logLevel,
    });
    rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
    rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();
  });
  /**
   * Constant defining the standard 'dev' Parsec genesis.json contents.
   *
   * @see https://github.com/hyperledger/parsec/blob/1.5.1/config/src/main/resources/dev.json
   */

  test(testcase, async () => {
    keychainPlugin.set(
      HelloWorldContractJson.contractName,
      JSON.stringify(HelloWorldContractJson),
    );
    const factory = new PluginFactoryLedgerConnector({
      pluginImportType: PluginImportType.Local,
    });
    const connector: PluginLedgerConnectorParsec = await factory.create({
      rpcApiHttpHost,
      rpcApiWsHost,
      instanceId: uuidv4(),
      pluginRegistry: new PluginRegistry({ plugins: [keychainPlugin] }),
    });
    await connector.onPluginInit();

    const req: GetBalanceV1Request = { address: firstHighNetWorthAccount };
    const currentBalance = await connector.getBalance(req);
    //makes the information in to string
    expect(currentBalance).toBeTruthy();
    expect(typeof currentBalance).toBe("object");
  });
});
