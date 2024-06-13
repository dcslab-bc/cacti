import test, { Test } from "tape-promise/tape";

import { v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import KeyEncoder from "key-encoder";
import { AddressInfo } from "net";
import Web3 from "web3";
import Web3JsQuorum, { IWeb3Quorum } from "web3js-quorum";

import {
  ApiServer,
  AuthorizationProtocol,
  ConfigService,
} from "@hyperledger/cactus-cmd-api-server";
import {
  Secp256k1Keys,
  KeyFormat,
  LogLevelDesc,
} from "@hyperledger/cactus-common";

import {
  ParsecTestLedger,
  pruneDockerAllIfGithubAction,
} from "@hyperledger/cactus-test-tooling";

import {
  ParsecApiClientOptions,
  ParsecApiClient,
  IPluginLedgerConnectorParsecOptions,
  PluginLedgerConnectorParsec,
  GetBalanceV1Request,
} from "@hyperledger/cactus-plugin-ledger-connector-parsec";

import { PluginRegistry } from "@hyperledger/cactus-core";

import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";

const testCase = "API Client can call getBalance via network";
const logLevel: LogLevelDesc = "TRACE";

test("BEFORE " + testCase, async (t: Test) => {
  const pruning = pruneDockerAllIfGithubAction({ logLevel });
  await t.doesNotReject(pruning, "Pruning didn't throw OK");
  t.end();
});

test(testCase, async (t: Test) => {
  const keyEncoder: KeyEncoder = new KeyEncoder("secp256k1");
  const keychainId = uuidv4();
  const keychainRef = uuidv4();

  const { privateKey } = Secp256k1Keys.generateKeyPairsBuffer();
  const keyHex = privateKey.toString("hex");
  const pem = keyEncoder.encodePrivate(keyHex, KeyFormat.Raw, KeyFormat.PEM);

  const keychain = new PluginKeychainMemory({
    backend: new Map([[keychainRef, pem]]),
    keychainId,
    logLevel,
    instanceId: uuidv4(),
  });

  const httpServer1 = createServer();
  await new Promise((resolve, reject) => {
    httpServer1.once("error", reject);
    httpServer1.once("listening", resolve);
    httpServer1.listen(0, "127.0.0.1");
  });
  const addressInfo1 = httpServer1.address() as AddressInfo;
  t.comment(`HttpServer1 AddressInfo: ${JSON.stringify(addressInfo1)}`);
  const node1Host = `http://${addressInfo1.address}:${addressInfo1.port}`;
  t.comment(`Cactus Node 1 Host: ${node1Host}`);

  const containerImageVersion = "20240411";
  const containerImageName =
    "edlp/opencbdc-tx-parsec-allinone";
  const parsecOptions = { containerImageName, containerImageVersion };
  const parsecTestLedger = new ParsecTestLedger(parsecOptions);
  await parsecTestLedger.start();

  const tearDown = async () => {
    await parsecTestLedger.stop();
    await parsecTestLedger.destroy();
  };

  test.onFinish(tearDown);
  const testAccount = await parsecTestLedger.createEthTestAccount();
  const rpcApiHttpHost = await parsecTestLedger.getRpcApiHttpHost();
  const rpcApiWsHost = await parsecTestLedger.getRpcApiWsHost();

  // 2. Instantiate plugin registry which will provide the web service plugin with the key value storage plugin
  const pluginRegistry = new PluginRegistry({ plugins: [keychain] });

  // 3. Instantiate the web service consortium plugin
  const options: IPluginLedgerConnectorParsecOptions = {
    instanceId: uuidv4(),
    rpcApiHttpHost,
    rpcApiWsHost,
    pluginRegistry,
    logLevel,
  };
  const pluginValidatorParsec = new PluginLedgerConnectorParsec(options);

  // 4. Create the API Server object that we embed in this test
  const configService = new ConfigService();
  const apiServerOptions = await configService.newExampleConfig();
  apiServerOptions.authorizationProtocol = AuthorizationProtocol.NONE;
  apiServerOptions.configFile = "";
  apiServerOptions.apiCorsDomainCsv = "*";
  apiServerOptions.apiPort = addressInfo1.port;
  apiServerOptions.cockpitPort = 0;
  apiServerOptions.apiTlsEnabled = false;
  const config = await configService.newExampleConfigConvict(apiServerOptions);

  pluginRegistry.add(pluginValidatorParsec);

  const apiServer = new ApiServer({
    httpServerApi: httpServer1,
    config: config.getProperties(),
    pluginRegistry,
  });

  // 5. make sure the API server is shut down when the testing if finished.
  test.onFinish(() => apiServer.shutdown());

  // 6. Start the API server which is now listening on port A and it's healthcheck works through the main SDK
  await apiServer.start();

  // 7. Instantiate the main SDK dynamically with whatever port the API server ended up bound to (port 0)
  t.comment(`AddressInfo: ${JSON.stringify(addressInfo1)}`);

  const web3Provider = new Web3.providers.HttpProvider(rpcApiHttpHost);
  const web3 = new Web3(web3Provider);
  const web3JsQuorum: IWeb3Quorum = Web3JsQuorum(web3);

  const orionKeyPair = await parsecTestLedger.getOrionKeyPair();
  const parsecKeyPair = await parsecTestLedger.getParsecKeyPair();

  const parsecPrivateKey = parsecKeyPair.privateKey.toLowerCase().startsWith("0x")
    ? parsecKeyPair.privateKey.substring(2)
    : parsecKeyPair.privateKey; // parsec node's private key

  const contractOptions = {
    data: `0x123`,
    // privateFrom : Orion public key of the sender.
    privateFrom: orionKeyPair.publicKey,
    // privateFor : Orion public keys of recipients or privacyGroupId: Privacy group to receive the transaction
    privateFor: [orionKeyPair.publicKey],
    // privateKey: Ethereum private key with which to sign the transaction.
    privateKey: parsecPrivateKey,
  };

  const transactionHash =
    await web3JsQuorum.priv.generateAndSendRawTransaction(contractOptions);
  await web3.eth.getTransaction(transactionHash);

  /*
  const transaction = await web3.eth.getTransaction(transactionHash);
  const singData = jsObjectSigner.sign(transaction.input);
  const signDataHex = Buffer.from(singData).toString("hex");
  */

  const request: GetBalanceV1Request = {
    //is it suppose to be GetBalanceV1Request?
    address: testAccount.address,
  };

  const configuration = new ParsecApiClientOptions({ basePath: node1Host });
  const api = new ParsecApiClient(configuration);

  // Test for 200 valid response test case
  const res = await api.getBalanceV1(request);
  t.ok(res, "API response object is truthy");
  t.true(typeof res.data.balance === "string", "Response is String ok");
});

test("AFTER " + testCase, async (t: Test) => {
  const pruning = pruneDockerAllIfGithubAction({ logLevel });
  await t.doesNotReject(pruning, "Pruning didn't throw OK");
  t.end();
});
