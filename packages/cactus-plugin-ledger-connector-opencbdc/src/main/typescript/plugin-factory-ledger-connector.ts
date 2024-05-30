import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC,
} from "./plugin-ledger-connector-opencbdc";

export class PluginFactoryLedgerConnector extends PluginFactory<
  PluginLedgerConnectorOpenCBDC,
  IPluginLedgerConnectorOpenCBDCOptions,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginLedgerConnectorOpenCBDCOptions,
  ): Promise<PluginLedgerConnectorOpenCBDC> {
    return new PluginLedgerConnectorOpenCBDC(pluginOptions);
  }
}
