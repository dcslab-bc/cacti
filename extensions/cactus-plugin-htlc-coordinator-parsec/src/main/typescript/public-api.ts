export * from "./generated/openapi/typescript-axios/index";
import { IPluginFactoryOptions } from "@hyperledger/cactus-core-api";
export {
  IPluginHTLCCoordinatorParsecOptions,
  PluginHTLCCoordinatorParsec,
} from "./plugin-htlc-coordinator-parsec";

export { PluginFactoryHTLCCoordinatorParsec } from "./plugin-factory-htlc-coordinator-parsec";
import { PluginFactoryHTLCCoordinatorParsec } from "./plugin-factory-htlc-coordinator-parsec";

export * from "./generated/openapi/typescript-axios/index";

export async function createPluginFactory(
  pluginFactoryOptions: IPluginFactoryOptions,
): Promise<PluginFactoryHTLCCoordinatorParsec> {
  return new PluginFactoryHTLCCoordinatorParsec(pluginFactoryOptions);
}
