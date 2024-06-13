import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";

import {
  IPluginHTLCCoordinatorParsecOptions,
  PluginHTLCCoordinatorParsec,
} from "./plugin-htlc-coordinator-parsec";

export class PluginFactoryHTLCCoordinatorParsec extends PluginFactory<
  PluginHTLCCoordinatorParsec,
  IPluginHTLCCoordinatorParsecOptions,
  IPluginFactoryOptions
> {
  async create(
    pluginOptions: IPluginHTLCCoordinatorParsecOptions,
  ): Promise<PluginHTLCCoordinatorParsec> {
    return new PluginHTLCCoordinatorParsec(pluginOptions);
  }
}
