import {
  IPluginFactoryOptions,
  PluginFactory,
} from "@hyperledger/cactus-core-api";
import {
  IPluginHtlcOpenCBDCOptions,
  PluginHtlcOpenCBDC,
} from "./plugin-htlc-opencbdc";

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
