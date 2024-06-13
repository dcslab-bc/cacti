import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginHtlcEthParsecOptions,
  PluginHtlcEthParsec,
} from "./plugin-htlc-eth-parsec";

export class PluginFactoryHtlcEthParsec extends PluginFactory<
  PluginHtlcEthParsec,
  IPluginHtlcEthParsecOptions,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginHtlcEthParsecOptions,
  ): Promise<PluginHtlcEthParsec> {
    return new PluginHtlcEthParsec(pluginOptions);
  }
}
