import "jest-extended";
import { v4 as uuidv4 } from "uuid";
import {
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC
} from "../../../../../../cactus-plugin-ledger-connector-opencbdc/src/main/typescript/plugin-ledger-connector-opencbdc";
import {
    LogLevelDesc,
  } from "@hyperledger/cactus-common";
import { PluginRegistry } from "@hyperledger/cactus-core";

const connectorId = uuidv4();
const logLevel: LogLevelDesc = "INFO";

const testCase = "Test deposit";
describe(testCase, () => {
  const keychainId = uuidv4();
  test(testCase, async () => {
    const pluginRegistry = new PluginRegistry();
    const options: IPluginLedgerConnectorOpenCBDCOptions = {
        rpcApiHttpHost: "http://localhost:8545",
        rpcApiWsHost: "ws://localhost:8546",
        pluginRegistry: pluginRegistry,
        instanceId: "myInstanceId",
    };

    const plugin = new PluginLedgerConnectorOpenCBDC(options);
    const res = await plugin.deposit({
      contractAddress: "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0",
      inputAmount: 100,
      outputAmount: 10,
      expiration: 2147483648,
      hashLock: "0x3c335ba7f06a8b01d0596589f73c19069e21c81e5013b91f408165d1bf623d32",
      receiver: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
      outputNetwork: "Besu",
      outputAddress: "1AcVYm7M3kkJQH28FXAvyBFQzFRL6xPKu8",
      connectorId: connectorId,
      web3SigningCredential: {
        "ethAccount":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        "secret":"0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        "type":"PRIVATE_KEY_HEX"
      },
      keychainId: keychainId,
    });
    console.log(res);
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
  });
});