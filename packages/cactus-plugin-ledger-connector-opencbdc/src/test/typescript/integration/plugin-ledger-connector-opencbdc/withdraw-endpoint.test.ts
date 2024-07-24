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
import CryptoMaterial from "../../../../crypto-material/crypto-material.json";
import OpenCBDCMaterial from "../../../../opencbdc-material/opencbdc-material.json";
  
const logLevel: LogLevelDesc = "INFO";
const connectorId = uuidv4();
const testCase = "Test withdraw";
describe(testCase, () => {
  const keychainId = uuidv4();
  test(testCase, async () => {
    const pluginRegistry = new PluginRegistry();
    const options: IPluginLedgerConnectorOpenCBDCOptions = {
      rpcApiHttpHost:  OpenCBDCMaterial.rpcApi.HttpHost.ip+":"+ OpenCBDCMaterial.rpcApi.HttpHost.port,
      rpcApiWsHost: OpenCBDCMaterial.rpcApi.WsHost.ip+":"+ OpenCBDCMaterial.rpcApi.WsHost.port,
      pluginRegistry: pluginRegistry,
      instanceId: CryptoMaterial.ledger.opencbdc.id,
    };

    const plugin = new PluginLedgerConnectorOpenCBDC(options);
    const res = await plugin.withdraw({
      id: "0x38e7a0f8929af36b5d5120edda5f86caa49fe2df4904cfa6eba6bf437d78aceb",
      secret: "my_secret",
      web3SigningCredential: {
        "ethAccount":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        "secret":"0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        "type":"PRIVATE_KEY_HEX"
      },
      connectorId: connectorId,
      keychainId: CryptoMaterial.keychains.opencbdc.id,
      gas: 10,
      HTLCId: "abcdefg",
    });
    console.log(res);
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
  });
});