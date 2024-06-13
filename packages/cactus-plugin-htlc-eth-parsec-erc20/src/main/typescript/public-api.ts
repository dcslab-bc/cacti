export * from "./generated/openapi/typescript-axios/index";

import { IPluginFactoryOptions } from "@hyperledger/cactus-core-api";

import { PluginFactoryHtlcEthParsecErc20 } from "./plugin-factory-htlc-eth-parsec-erc20";
export {
  PluginHtlcEthParsecErc20,
  IPluginHtlcEthParsecErc20Options,
} from "./plugin-htlc-eth-parsec-erc20";

export { PluginFactoryHtlcEthParsecErc20 } from "./plugin-factory-htlc-eth-parsec-erc20";

export async function createPluginFactory(
  pluginFactoryOptions: IPluginFactoryOptions,
): Promise<PluginFactoryHtlcEthParsecErc20> {
  return new PluginFactoryHtlcEthParsecErc20(pluginFactoryOptions);
}
