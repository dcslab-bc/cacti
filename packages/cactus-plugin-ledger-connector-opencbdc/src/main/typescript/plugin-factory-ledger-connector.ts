import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC,

} from "./plugin-ledger-connector-opencbdc";

import {
  PluginHtlcOpenCBDC,
  IPluginHtlcOpenCBDCOptions,
} from "./plugin-htlc-opencbdc";


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

export class PluginFactoryHtlcOpenCBDC extends PluginFactory<
  PluginHtlcOpenCBDC,
  IPluginHtlcOpenCBDCOptions,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginHtlcOpenCBDCOptions,
  ): Promise<PluginHtlcOpenCBDC> {
    return new PluginHtlcOpenCBDC(pluginOptions);
  }
}

