import test, { Test } from "tape";
import { v4 as uuidv4 } from "uuid";
import { PluginRegistry } from "@hyperledger/cactus-core";
import {
  PluginLedgerConnectorParsec,
  PluginFactoryLedgerConnector,
  GetPastLogsV1Request,
} from "../../../../../main/typescript/public-api";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { ParsecTestLedger } from "@hyperledger/cactus-test-tooling";
import { LogLevelDesc } from "@hyperledger/cactus-common";
import HelloWorldContractJson from "../../../../solidity/hello-world-contract/HelloWorld.json";
import Web3 from "web3";
import { PluginImportType } from "@hyperledger/cactus-core-api";

test("can get past logs of an account", async (t: Test) => {
  const logLevel: LogLevelDesc = "TRACE";
  const containerImageVersion = "2021-08-24--feat-1244";
  const containerImageName =
    "ghcr.io/hyperledger/cactus-parsec-21-1-6-all-in-one";
  const parsecOptions = { containerImageName, containerImageVersion };
  const parsecTestLedger = new ParsecTestLedger(parsecOptions);
  await parsecTestLedger.start();

  test.onFinish(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
  });

  const rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
  const rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();

  /**
   * Constant defining the standard 'dev' Parsec genesis.json contents.
   *
   * @see https://github.com/hyperledger/parsec/blob/21.1.6/config/src/main/resources/dev.json
   */
  const firstHighNetWorthAccount = parsecTestLedger.getGenesisAccountPubKey();

  const web3 = new Web3(rpcApiHttpHost);
  const testEthAccount = web3.eth.accounts.create(uuidv4());

  const keychainEntryKey = uuidv4();
  const keychainEntryValue = testEthAccount.privateKey;
  const keychainPlugin = new PluginKeychainMemory({
    instanceId: uuidv4(),
    keychainId: uuidv4(),
    // pre-provision keychain with mock backend holding the private key of the
    // test account that we'll reference while sending requests with the
    // signing credential pointing to this keychain entry.
    backend: new Map([[keychainEntryKey, keychainEntryValue]]),
    logLevel,
  });
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

  const req: GetPastLogsV1Request = { address: firstHighNetWorthAccount };
  const pastLogs = await connector.getPastLogs(req);
  t.comment(JSON.stringify(pastLogs));
  t.ok(pastLogs, "Past logs response is OK :-)");
  t.equal(typeof pastLogs, "object", "Past logs response type is OK :-)");
  t.end();
});
