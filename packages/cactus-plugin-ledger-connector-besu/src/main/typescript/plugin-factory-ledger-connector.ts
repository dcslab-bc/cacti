import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginLedgerConnectorParsecOptions,
  PluginLedgerConnectorParsec,
} from "./plugin-ledger-connector-parsec";

export class PluginFactoryLedgerConnector extends PluginFactory<
  PluginLedgerConnectorParsec,
  IPluginLedgerConnectorParsecOptions,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginLedgerConnectorParsecOptions,
  ): Promise<PluginLedgerConnectorParsec> {
    return new PluginLedgerConnectorParsec(pluginOptions);
  }
}
