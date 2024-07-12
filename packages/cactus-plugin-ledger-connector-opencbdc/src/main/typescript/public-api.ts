export {
  E_KEYCHAIN_NOT_FOUND,
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC,
} from "./plugin-ledger-connector-opencbdc";
export { PluginFactoryLedgerConnector } from "./plugin-factory-ledger-connector";

import { IPluginFactoryOptions } from "@hyperledger/cactus-core-api";
import { PluginFactoryLedgerConnector } from "./plugin-factory-ledger-connector";

export {
  OpenCBDCApiClient,
  OpenCBDCApiClientOptions,
} from "./api-client/opencbdc-api-client";

export * from "./generated/openapi/typescript-axios/api";

export async function createPluginFactory(
  pluginFactoryOptions: IPluginFactoryOptions,
): Promise<PluginFactoryLedgerConnector> {
  return new PluginFactoryLedgerConnector(pluginFactoryOptions);
}
