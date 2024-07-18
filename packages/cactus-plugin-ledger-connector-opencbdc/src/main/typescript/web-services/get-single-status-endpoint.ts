import { Express, Request, Response } from "express";
import {
  Checks,
  IAsyncProvider,
  Logger,
  LoggerProvider,
  LogLevelDesc,
} from "@hyperledger/cactus-common";
import {
  IEndpointAuthzOptions,
  IExpressRequestHandler,
  IWebServiceEndpoint,
} from "@hyperledger/cactus-core-api";
import { registerWebServiceEndpoint } from "@hyperledger/cactus-core";
import OAS from "../../json/openapi_htlc.json";
import { PluginHtlcOpenCBDC } from "../plugin-htlc-opencbdc";

export interface IGetSingleStatusEndpointOptions {
  logLevel?: LogLevelDesc;
  plugin: PluginHtlcOpenCBDC;
}

export class GetSingleStatusEndpoint implements IWebServiceEndpoint {
  public static readonly CLASS_NAME = "GetSingleStatusEndpoint";
  private readonly log: Logger;

  constructor(public readonly options: IGetSingleStatusEndpointOptions) {
    const fnTag = `${this.className}#constructor()`;
    const level = this.options.logLevel || "INFO";
    const label = this.className;
    Checks.truthy(options, `${fnTag} arg options`);
    this.log = LoggerProvider.getOrCreate({ level, label });
  }

  public get className(): string {
    return GetSingleStatusEndpoint.CLASS_NAME;
  }

  public get oasPath(): typeof OAS.paths["/api/v1/plugins/@hyperledger/cactus-plugin-htlc-opencbdc/get-single-status"] {
    return OAS.paths[
      "/api/v1/plugins/@hyperledger/cactus-plugin-htlc-opencbdc/get-single-status"
    ];
  }
  public getVerbLowerCase(): string {
    return this.oasPath.post["x-hyperledger-cactus"].http.verbLowerCase;
  }

  public getPath(): string {
    return this.oasPath.post["x-hyperledger-cactus"].http.path;
  }

  public getOperationId(): string {
    return this.oasPath.post.operationId;
  }

  getAuthorizationOptionsProvider(): IAsyncProvider<IEndpointAuthzOptions> {
    // TODO: make this an injectable dependency in the constructor
    return {
      get: async () => ({
        isProtected: true,
        requiredRoles: [],
      }),
    };
  }

  public async registerExpress(
    expressApp: Express,
  ): Promise<IWebServiceEndpoint> {
    await registerWebServiceEndpoint(expressApp, this);
    return this;
  }

  public getExpressRequestHandler(): IExpressRequestHandler {
    return this.handleRequest.bind(this);
  }

  public async handleRequest(req: Request, res: Response): Promise<void> {
    const fnTag = "GetSingleStatusEndpoint#handleRequest()";
    this.log.debug(`POST ${this.getPath()}`);
    try {
      const { callOutput } = await this.options.plugin.getSingleStatus(
        req.body,
      );

      res.send(callOutput);
    } catch (ex) {
      this.log.error(`${fnTag} failed to serve request`, ex);
      res.status(400).json({
        message: "Bad request",
        error: ex?.stack || ex?.message,
      });
    }
  }
}
