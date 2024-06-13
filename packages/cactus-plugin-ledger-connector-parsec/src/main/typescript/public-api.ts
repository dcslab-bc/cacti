export {
  E_KEYCHAIN_NOT_FOUND,
  IPluginLedgerConnectorParsecOptions,
  PluginLedgerConnectorParsec,
} from "./plugin-ledger-connector-parsec";
export { PluginFactoryLedgerConnector } from "./plugin-factory-ledger-connector";

import { IPluginFactoryOptions } from "@hyperledger/cactus-core-api";
import { PluginFactoryLedgerConnector } from "./plugin-factory-ledger-connector";

export {
  ParsecApiClient,
  ParsecApiClientOptions,
} from "./api-client/parsec-api-client";

export * from "./generated/openapi/typescript-axios/api";

export async function createPluginFactory(
  pluginFactoryOptions: IPluginFactoryOptions,
): Promise<PluginFactoryLedgerConnector> {
  return new PluginFactoryLedgerConnector(pluginFactoryOptions);
}
