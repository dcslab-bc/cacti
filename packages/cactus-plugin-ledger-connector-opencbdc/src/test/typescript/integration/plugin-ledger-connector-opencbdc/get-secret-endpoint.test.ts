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

const testCase = "Test get Secret";
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
    const getSecretRequest: any = {
      address: CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address,
    }

    const resSecret = await plugin.getSecret(getSecretRequest);
    expect(resSecret.status).toEqual(200);
    expect(resSecret.data.secret).toEqual(CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.privateKey);
  });
});