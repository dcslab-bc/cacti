import "jest-extended";

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

const testCase = "Test init";
describe(testCase, () => {
  test(testCase, async () => {
    const pluginRegistry = new PluginRegistry();
    const options: IPluginLedgerConnectorOpenCBDCOptions = {
      rpcApiHttpHost:  OpenCBDCMaterial.rpcApi.HttpHost.ip+":"+ OpenCBDCMaterial.rpcApi.HttpHost.port,
      rpcApiWsHost: OpenCBDCMaterial.rpcApi.WsHost.ip+":"+ OpenCBDCMaterial.rpcApi.WsHost.port,
      pluginRegistry: pluginRegistry,
      instanceId: CryptoMaterial.ledger.opencbdc.id,
    };

    const plugin = new PluginLedgerConnectorOpenCBDC(options);
    const initRequest: any = { 
    }

    const resInit = await plugin.init(initRequest);
    expect(resInit.status).toEqual(200);
    expect(resInit.data.success).toEqual(true);
  });
});