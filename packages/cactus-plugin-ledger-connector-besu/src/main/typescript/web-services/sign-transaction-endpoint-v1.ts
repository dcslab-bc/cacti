import { Express, Request, Response } from "express";

import { registerWebServiceEndpoint } from "@hyperledger/cactus-core";

import {
  IWebServiceEndpoint,
  IExpressRequestHandler,
  IEndpointAuthzOptions,
} from "@hyperledger/cactus-core-api";

import {
  LogLevelDesc,
  Logger,
  LoggerProvider,
  Checks,
  IAsyncProvider,
} from "@hyperledger/cactus-common";

import { SignTransactionRequest } from "../generated/openapi/typescript-axios/api";

import { PluginLedgerConnectorParsec } from "../plugin-ledger-connector-parsec";
import OAS from "../../json/openapi.json";

export interface IParsecSignTransactionEndpointOptions {
  connector: PluginLedgerConnectorParsec;
  logLevel?: LogLevelDesc;
}

export class ParsecSignTransactionEndpointV1 implements IWebServiceEndpoint {
  private readonly log: Logger;

  constructor(public readonly options: IParsecSignTransactionEndpointOptions) {
    const fnTag = "ParsecSignTransactionEndpointV1#constructor()";

    Checks.truthy(options, `${fnTag} options`);
    Checks.truthy(options.connector, `${fnTag} options.connector`);

    const label = "parsec-sign-transaction-endpoint";
    const level = options.logLevel || "INFO";
    this.log = LoggerProvider.getOrCreate({ label, level });
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

  public getExpressRequestHandler(): IExpressRequestHandler {
    return this.handleRequest.bind(this);
  }

  public get oasPath(): (typeof OAS.paths)["/api/v1/plugins/@hyperledger/cactus-plugin-ledger-connector-parsec/sign-transaction"] {
    return OAS.paths[
      "/api/v1/plugins/@hyperledger/cactus-plugin-ledger-connector-parsec/sign-transaction"
    ];
  }

  getPath(): string {
    return this.oasPath.post["x-hyperledger-cacti"].http.path;
  }

  getVerbLowerCase(): string {
    return this.oasPath.post["x-hyperledger-cacti"].http.verbLowerCase;
  }

  public getOperationId(): string {
    return this.oasPath.post.operationId;
  }

  public async registerExpress(
    expressApp: Express,
  ): Promise<IWebServiceEndpoint> {
    await registerWebServiceEndpoint(expressApp, this);
    return this;
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const fnTag = "ParsecSignTransactionEndpointV1#handleRequest()";
    this.log.debug(`POST ${this.getPath()}`);

    try {
      const request: SignTransactionRequest =
        req.body as SignTransactionRequest;

      const trxResponse = await this.options.connector.signTransaction(request);

      if (trxResponse.isPresent()) {
        res.status(200);
        res.json(trxResponse.get());
      } else {
        this.log.error(`${fnTag} failed to find the transaction`);
        res.status(404);
        res.statusMessage = "Transaction not found";
        res.json({ error: "Transaction not found" });
      }
    } catch (ex) {
      this.log.error(`${fnTag} failed to serve request`, ex);
      res.status(500);
      res.statusMessage = ex.message;
      res.json({ error: ex.stack });
    }
  }
}
