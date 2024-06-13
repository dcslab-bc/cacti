import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginHtlcEthParsecErc20Options,
  PluginHtlcEthParsecErc20,
} from "./plugin-htlc-eth-parsec-erc20";

export class PluginFactoryHtlcEthParsecErc20 extends PluginFactory<
  PluginHtlcEthParsecErc20,
  IPluginHtlcEthParsecErc20Options,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginHtlcEthParsecErc20Options,
  ): Promise<PluginHtlcEthParsecErc20> {
    return new PluginHtlcEthParsecErc20(pluginOptions);
  }
}
