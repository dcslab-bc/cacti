#!/usr/bin/env node

import {
  AuthorizationProtocol,
  ConfigService,
  IAuthorizationConfig,
} from "@hyperledger/cactus-cmd-api-server";
import { LoggerProvider } from "@hyperledger/cactus-common";
import {
  IBokHtlcCactusNodeApp,
  BokHtlcCactusNodeApp,
} from "./bok-htlc-cactus-node-app";
import CryptoMaterial from "../../crypto-material/crypto-material.json";
import "dotenv/config";

export async function launchApp(
  env?: NodeJS.ProcessEnv,
  args?: string[],
): Promise<void> {
  const configService = new ConfigService();
  const exampleConfig = await configService.newExampleConfig();
  exampleConfig.configFile = "";
  exampleConfig.authorizationConfigJson = JSON.stringify(
    exampleConfig.authorizationConfigJson,
  ) as unknown as IAuthorizationConfig;
  exampleConfig.authorizationProtocol = AuthorizationProtocol.NONE;

  const convictConfig =
    await configService.newExampleConfigConvict(exampleConfig);

  env = await configService.newExampleConfigEnv(convictConfig.getProperties());

  const config = await configService.getOrCreate({ args, env });
  const serverOptions = config.getProperties();

  LoggerProvider.setLogLevel(serverOptions.logLevel);

  if (
    process.env.API_HOST == undefined ||
    process.env.API_SERVER_PORT == undefined
  ) {
    throw new Error("Env variables not set");
  }

  const appOptions: IBokHtlcCactusNodeApp = {
    apiHost: process.env.API_HOST,
    apiServerPort: parseInt(process.env.API_SERVER_PORT),
    logLevel: "DEBUG",
  };

  const bokHtlcCactusNodeApp = new BokHtlcCactusNodeApp(appOptions);
  try {
    await bokHtlcCactusNodeApp.start();
    console.info("BokHtlcCactusNodeApp running...");
  } catch (ex) {
    console.error(`BokHtlcCactusNodeApp crashed. Existing...`, ex);
    await bokHtlcCactusNodeApp.stop();
    process.exit(-1);
  }
}

if (require.main === module) {
  launchApp();
}
