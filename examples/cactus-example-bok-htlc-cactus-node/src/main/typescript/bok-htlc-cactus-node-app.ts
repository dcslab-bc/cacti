import { AddressInfo } from "net";
import { v4 as uuidv4 } from "uuid";
import { Server } from "http";
import exitHook, { IAsyncExitHookDoneCallback } from "async-exit-hook";
import { PluginRegistry } from "@hyperledger/cactus-core";
import { Constants, PluginImportType } from "@hyperledger/cactus-core-api";
import {
  LogLevelDesc,
  Logger,
  LoggerProvider,
  Servers,
} from "@hyperledger/cactus-common";
import {
  ApiServer,
  AuthorizationProtocol,
  ConfigService,
  Configuration,
  ICactusApiServerOptions,
} from "@hyperledger/cactus-cmd-api-server";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { CbdcHtlcInfrastructure } from "./infrastructure/cbdc-htlc-infrastructure";
import {
  IPluginHtlcEthBesuErc20Options,
  PluginFactoryHtlcEthBesuErc20,
} from "@hyperledger/cactus-plugin-htlc-eth-besu-erc20";
import {
  IPluginHTLCCoordinatorBesuOptions,
  PluginFactoryHTLCCoordinatorBesu,
} from "@hyperledger/cactus-plugin-htlc-coordinator-besu";

import {
  IPluginHtlcEthParsecErc20Options,
  PluginFactoryHtlcEthParsecErc20,
  DefaultApi as ParsecApi,
} from "@hyperledger/cactus-plugin-htlc-eth-parsec-erc20";

import {
  IPluginHTLCCoordinatorParsecOptions,
  PluginFactoryHTLCCoordinatorParsec,
} from "@hyperledger/cactus-plugin-htlc-coordinator-parsec";

import {
  DefaultApi as BesuApi,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";

import CryptoMaterial from "../../crypto-material/crypto-material.json";

export interface IBokHtlcCactusNodeApp {
  apiHost: string;
  apiServerPort: number;
  logLevel?: LogLevelDesc;
  apiServerOptions?: ICactusApiServerOptions;
  disableSignalHandlers?: true;
}

interface ICrpcOptions {
  host: string;
  port: number;
}

export type ShutdownHook = () => Promise<void>;
export class BokHtlcCactusNodeApp {
  private readonly log: Logger;
  private readonly shutdownHooks: ShutdownHook[];
  readonly infrastructure: CbdcHtlcInfrastructure;

  public constructor(public readonly options: IBokHtlcCactusNodeApp) {
    const fnTag = "BokHtlcCactusNodeApp#constructor()";

    if (!options) {
      throw new Error(`${fnTag} options parameter is falsy`);
    }
    const { logLevel } = options;

    const level = logLevel || "DEBUG";
    const label = "bok-htlc-cactus-node-app";
    this.log = LoggerProvider.getOrCreate({ level, label });

    this.shutdownHooks = [];

    this.infrastructure = new CbdcHtlcInfrastructure({
      logLevel: level,
    });
  }

  public async start(): Promise<IStartInfo> {
    this.log.debug(`Starting BoK HTLC Cactus Node App...`);

    if (!this.options.disableSignalHandlers) {
      exitHook((callback: IAsyncExitHookDoneCallback) => {
        this.stop().then(callback);
      });
      this.log.debug(`Registered signal handlers for graceful auto-shutdown`);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Cactus API Server
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Reserve the ports where the API Servers will run
    const httpApi = await Servers.startOnPort(
      this.options.apiServerPort,
      this.options.apiHost,
    );

    // Add PKI Identity to API Server
    const nodeApiPluginRegistry = new PluginRegistry({
      plugins: [
        new PluginKeychainMemory({
          keychainId: CryptoMaterial.keychains.keychain1.id,
          instanceId: uuidv4(),
          logLevel: "INFO",
        }),
      ],
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Ledger : Besu
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Create Ledger Connector
    const besuPlugin = await this.infrastructure.createBesuLedgerConnector();

    // Create HTLC ERC20 Plugin Options
    const iPluginHtlcEthBesuErc20Options: IPluginHtlcEthBesuErc20Options = {
      instanceId: uuidv4(),
      keychainId: CryptoMaterial.keychains.keychain1.id,
      pluginRegistry: nodeApiPluginRegistry,
    };

    // Create HTLC ERC20 Plugin Factory
    const pluginFactoryHtlcEthBesuErc20 = new PluginFactoryHtlcEthBesuErc20({
      pluginImportType: PluginImportType.Local,
    });

    // Create HTLC ERC20 Plugin
    const pluginHtlcEthBesuErc20 = await pluginFactoryHtlcEthBesuErc20.create(
      iPluginHtlcEthBesuErc20Options,
    );

    // Create HTLC Coordinator Plugin Options
    const pluginBesuOptions: IPluginHTLCCoordinatorBesuOptions = {
      instanceId: uuidv4(),
      logLevel: "INFO",
      pluginRegistry: nodeApiPluginRegistry,
    };

    // Create HTLC Coordinator Plugin Factory
    const factoryHTLC = new PluginFactoryHTLCCoordinatorBesu({
      pluginImportType: PluginImportType.Local,
    });

    // Create HTLC Coordinator Plugin
    const pluginHTLCCoordinatorBesu = await factoryHTLC.create(pluginBesuOptions);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Ledger : Parsec
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Create Ledger Connector
    const parsecPlugin = await this.infrastructure.createParsecLedgerConnector();

    // Create HTLC ERC20 Plugin Options
    const iPluginHtlcEthParsecErc20Options: IPluginHtlcEthParsecErc20Options = {
      instanceId: uuidv4(),
      keychainId: CryptoMaterial.keychains.keychain2.id,
      pluginRegistry: nodeApiPluginRegistry,
    };

    // Create HTLC ERC20 Plugin Factory
    const pluginFactoryHtlcEthParsecErc20 = new PluginFactoryHtlcEthParsecErc20({
      pluginImportType: PluginImportType.Local,
    });

    // Create HTLC ERC20 Plugin
    const pluginHtlcEthParsecErc20 = await pluginFactoryHtlcEthParsecErc20.create(
      iPluginHtlcEthParsecErc20Options,
    );

    // Create HTLC Coordinator Plugin Options
    const pluginParsecOptions: IPluginHTLCCoordinatorParsecOptions = {
      instanceId: uuidv4(),
      logLevel: "INFO",
      pluginRegistry: nodeApiPluginRegistry,
    };

    // Create HTLC Coordinator Plugin Factory
    const factoryParsecHTLC = new PluginFactoryHTLCCoordinatorParsec({
      pluginImportType: PluginImportType.Local,
    });

    // Create HTLC Coordinator Plugin
    const pluginHTLCCoordinatorParsec = await factoryParsecHTLC.create(pluginParsecOptions);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Plugins add : API Server <- Plugins
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Besu
    nodeApiPluginRegistry.add(besuPlugin);
    nodeApiPluginRegistry.add(pluginHtlcEthBesuErc20);
    nodeApiPluginRegistry.add(pluginHTLCCoordinatorBesu);

    // Parsec
    nodeApiPluginRegistry.add(parsecPlugin);
    nodeApiPluginRegistry.add(pluginHtlcEthParsecErc20);
    nodeApiPluginRegistry.add(pluginHTLCCoordinatorParsec);

    // Start Cactus API Server
    const apiServer = await this.startNode(
      httpApi,
      nodeApiPluginRegistry,
    );

    return {
      apiServer,
    };
  }

  public async stop(): Promise<void> {
    for (const hook of this.shutdownHooks) {
      await hook(); // FIXME add timeout here so that shutdown does not hang
    }
  }

  public onShutdown(hook: ShutdownHook): void {
    this.shutdownHooks.push(hook);
  }

  public async startNode(
    httpServerApi: Server,
    pluginRegistry: PluginRegistry,
  ): Promise<ApiServer> {
    this.log.info(`Starting API Server node...`);

    const addressInfoApi = httpServerApi.address() as AddressInfo;

    let config;
    if (this.options.apiServerOptions) {
      config = this.options.apiServerOptions;
    } else {
      const configService = new ConfigService();
      const convictConfig = await configService.getOrCreate();
      config = convictConfig.getProperties();
      config.configFile = "";
      config.apiCorsDomainCsv = `http://${process.env.API_HOST}:${process.env.API_SERVER_PORT}`;
      config.cockpitCorsDomainCsv = `http://${process.env.API_HOST}:${process.env.API_SERVER_PORT}`;
      config.apiPort = addressInfoApi.port;
      config.apiHost = addressInfoApi.address;
      config.grpcPort = 0;
      config.logLevel = this.options.logLevel || "INFO";
      config.authorizationProtocol = AuthorizationProtocol.NONE;
      config.apiMtlsEnabled = false;
      config.apiTlsEnabled = false;
    }

    const apiServer = new ApiServer({
      config,
      httpServerApi,
      pluginRegistry,
    });

    this.onShutdown(() => apiServer.shutdown());

    await apiServer.start();

    return apiServer;
  }
}

export interface IStartInfo {
  readonly apiServer: ApiServer;
}
