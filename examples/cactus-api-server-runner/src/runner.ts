// import { PluginImportType, PluginImportAction } from "@hyperledger/cactus-core-api";

import { createServer } from "http";
import {
  AuthorizationProtocol,
  ApiServer,
  ConfigService,
  IAuthorizationConfig
} from "@hyperledger/cactus-cmd-api-server";
import { LoggerProvider } from "@hyperledger/cactus-common";

const main = async () => {
  const configService = new ConfigService();
  const apiServerOptions = await configService.newExampleConfig();
  apiServerOptions.configFile = "";
  apiServerOptions.apiPort = 3000;
  apiServerOptions.cockpitPort = 4000;
  apiServerOptions.grpcPort = 5000;
  apiServerOptions.apiTlsEnabled = false;
  apiServerOptions.authorizationProtocol = AuthorizationProtocol.NONE;
  apiServerOptions.authorizationConfigJson = (JSON.stringify(
    apiServerOptions.authorizationConfigJson,
  ) as unknown) as IAuthorizationConfig;
  apiServerOptions.plugins = [
    {
      packageName: "@hyperledger/cactus-plugin-htlc-eth-besu-erc20",
      type: "org.hyperledger.cactus.plugin_import_type.LOCAL",
      action: "org.hyperledger.cactus.plugin_import_action.INSTALL" ,
      options: {
        instanceId: "snu-htlc-eth-besu-erc20-1",
      },
    },
    {
      packageName: "cactus-plugin-ledger-connector-besu",
      type: "org.hyperledger.cactus.plugin_import_type.LOCAL",
      action: "org.hyperledger.cactus.plugin_import_action.INSTALL" ,
      options: {
        rpcApiWsHost: "http://127.0.0.1:8546",
        rpcApiHttpHost: "http://127.0.0.1:8545",
        instanceId: "snu-besu-connector-1",
      },
    },
  ];
  const config = await configService.newExampleConfigConvict(apiServerOptions);
  const apiServer = new ApiServer({
    httpServerApi: createServer(),
    config: config.getProperties(),
  });

  //Starting the Cacti APIServer
  apiServer.start();  
};

function sleep(ms: number) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

export async function launchApp(): Promise<void> {
  try {
    await main();
    console.info(`Cactus API server launched OK `);
  } catch (ex) {
    console.info(`Cactus API server crashed: `, ex);
  }
}

if (require.main === module) {
  launchApp();
}