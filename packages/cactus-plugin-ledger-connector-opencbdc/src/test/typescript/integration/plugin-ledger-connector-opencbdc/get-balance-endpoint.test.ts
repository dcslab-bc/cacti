import "jest-extended";

import {
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC
} from "../../../../../../cactus-plugin-ledger-connector-opencbdc/src/main/typescript/plugin-ledger-connector-opencbdc";
import {
  LogLevelDesc,
} from "@hyperledger/cactus-common";
import { PluginRegistry } from "@hyperledger/cactus-core";

const logLevel: LogLevelDesc = "INFO";

const testCase = "Test get balance";
describe(testCase, () => {
  test(testCase, async () => {
    const pluginRegistry = new PluginRegistry();
    const options: IPluginLedgerConnectorOpenCBDCOptions = {
        rpcApiHttpHost: "http://localhost:8545",
        rpcApiWsHost: "ws://localhost:8546",
        pluginRegistry: pluginRegistry,
        instanceId: "myInstanceId",
    };

    const plugin = new PluginLedgerConnectorOpenCBDC(options);
    const getBalanceRequest: any = {
      address: '0xab94eFe55d465a02c5a0a7ca4eD83E98EeddE5aE'
    }

    const resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(100000000);
  });
});