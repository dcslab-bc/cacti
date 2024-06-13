import * as HashTimeLockJson from "../solidity/contracts/HashTimeLock.json";
export { HashTimeLockJson };

export * from "./generated/openapi/typescript-axios/index";

import { IPluginFactoryOptions } from "@hyperledger/cactus-core-api";

import { PluginFactoryHtlcEthParsec } from "./plugin-factory-htlc-eth-parsec";
export {
  PluginHtlcEthParsec,
  IPluginHtlcEthParsecOptions,
} from "./plugin-htlc-eth-parsec";
export { PluginFactoryHtlcEthParsec } from "./plugin-factory-htlc-eth-parsec";
export async function createPluginFactory(
  pluginFactoryOptions: IPluginFactoryOptions,
): Promise<PluginFactoryHtlcEthParsec> {
  return new PluginFactoryHtlcEthParsec(pluginFactoryOptions);
}
