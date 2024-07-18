import test, { Test } from "tape";
import { v4 as uuidv4 } from "uuid";
import { PluginRegistry } from "@hyperledger/cactus-core";
import {
  PluginLedgerConnectorParsec,
  PluginFactoryLedgerConnector,
  GetBlockV1Request,
} from "../../../../../main/typescript/public-api";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { ParsecTestLedger } from "@hyperledger/cactus-test-tooling";
import { LogLevelDesc } from "@hyperledger/cactus-common";
import HelloWorldContractJson from "../../../../solidity/hello-world-contract/HelloWorld.json";
import Web3 from "web3";
import { PluginImportType } from "@hyperledger/cactus-core-api";

test("can get block from blockchain", async (t: Test) => {
  const logLevel: LogLevelDesc = "TRACE";
  const parsecTestLedger = new ParsecTestLedger();
  await parsecTestLedger.start();

  test.onFinish(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
  });

  const rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
  const rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();
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
  await connector.onPluginInit();

  const request: GetBlockV1Request = { blockHashOrBlockNumber: 0 };
  const currentBlock = await connector.getBlock(request);
  t.comment(JSON.stringify(currentBlock));
  //makes the information in to string
  t.ok(currentBlock, " Block response is OK :-)");
  t.equal(typeof currentBlock, "object", "Block response type is OK :-)");
  t.end();
});
