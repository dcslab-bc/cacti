import { v4 as uuidv4 } from "uuid";
import { PluginRegistry } from "@hyperledger/cactus-core";
import "jest-extended";

import {
  PluginLedgerConnectorParsec,
  PluginFactoryLedgerConnector,
  ReceiptType,
  Web3SigningCredentialType,
} from "../../../../main/typescript/public-api";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { BesuTestLedger } from "@hyperledger/cactus-test-tooling";
import { LogLevelDesc } from "@hyperledger/cactus-common";
import HelloWorldContractJson from "../../../solidity/hello-world-contract/HelloWorld.json";
import Web3 from "web3";
import { PluginImportType } from "@hyperledger/cactus-core-api";
import { GetTransactionV1Request } from "../../../../main/typescript/generated/openapi/typescript-axios/api";

const testCase = "PluginLedgerConnectorParsec";
describe(testCase, () => {
  const logLevel: LogLevelDesc = "TRACE";
  const parsecTestLedger = new BesuTestLedger();

  afterAll(async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
  });

  test("can get past logs of an account", async () => {
    await parsecTestLedger.start();

    const rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
    const rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();

    /**
     * Constant defining the standard 'dev' Parsec genesis.json contents.
     *
     * @see https://github.com/hyperledger/parsec/blob/1.5.1/config/src/main/resources/dev.json
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

    await connector.onPluginInit();

    const privateKey = await parsecTestLedger.getGenesisAccountPrivKey();
    const { transactionReceipt } = await connector.transact({
      web3SigningCredential: {
        ethAccount: firstHighNetWorthAccount,
        secret: privateKey,
        type: Web3SigningCredentialType.PrivateKeyHex,
      },
      consistencyStrategy: {
        blockConfirmations: 0,
        receiptType: ReceiptType.LedgerBlockAck,
        timeoutMs: 60000,
      },
      transactionConfig: {
        from: firstHighNetWorthAccount,
        to: testEthAccount.address,
        value: 10e9,
        gas: 1000000,
      },
    });

    const req: GetTransactionV1Request = {
      transactionHash: transactionReceipt.transactionHash,
    };
    const response = await connector.getTransaction(req);
    expect(response.transaction).toBeTruthy();
    expect(typeof response.transaction).toBe("object");
  });
});
