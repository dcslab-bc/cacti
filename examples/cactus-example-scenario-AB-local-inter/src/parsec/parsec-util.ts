/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Logger,
    Checks,
    LogLevelDesc,
    LoggerProvider,
} from "@hyperledger/cactus-common";
import {
    DefaultApi as ParsecApi,
    DeployContractSolidityBytecodeV1Request,
    Web3SigningCredentialType,
    PluginFactoryLedgerConnector,
    PluginLedgerConnectorParsec,
    EthContractInvocationType,
    InvokeContractV1Request,
  } from "@hyperledger/cactus-plugin-ledger-connector-parsec";

import "dotenv/config";

import {
ApiServer,
AuthorizationProtocol,
ConfigService,
Configuration,
ICactusApiServerOptions,
} from "@hyperledger/cactus-cmd-api-server";

export class ParsecUtil {

    // deploy parsec contract
    public async deployParsecContracts(log: Logger, parsecApi: ParsecApi, keychainId: string, contractJson: any, address: string, privateKey: string, constructorArgs?: any[]): Promise<string> {

        // request
        const deployContractRequest: DeployContractSolidityBytecodeV1Request = {
            keychainId: keychainId,
            contractName: contractJson.contractName,
            contractAbi: contractJson.abi,
            constructorArgs: constructorArgs!,
            web3SigningCredential: {
            ethAccount: address,
            secret: privateKey,
            type: Web3SigningCredentialType.PrivateKeyHex,
            },
            bytecode: contractJson.bytecode,
            gas: 10000000,
        };
        log.debug("Request : " + JSON.stringify(deployContractRequest));

        // process
        const deployContractResponse = await parsecApi.deployContractSolBytecodeV1(deployContractRequest);

        // response
        if (deployContractResponse == undefined) {
            log.error("error when deploying smart contract");

            throw new Error("error when deploying smart contract");
        }
        else{
            log.debug("Response : " + JSON.stringify(deployContractResponse.data.transactionReceipt));
            log.debug("Contract Address : " + deployContractResponse.data.transactionReceipt.contractAddress);

            return deployContractResponse.data.transactionReceipt.contractAddress!;
        }
    }

    // invoke besu contract
    public async invokeParsecContracts(log: Logger, invocationType: EthContractInvocationType, parsecApi: ParsecApi, keychainId: string, contractName: string, contractAddress: string, methodName: string, address: string, privateKey: string, params?: any[]): Promise<any> {

        // request
        const invokeContractRequest: InvokeContractV1Request = {
            keychainId: keychainId,
            contractName: contractName,
            contractAddress: contractAddress,
            invocationType: invocationType,
            methodName: methodName,
            signingCredential: {
            ethAccount: address,
            secret: privateKey,
            type: Web3SigningCredentialType.PrivateKeyHex,
            },
            params: params!,
            gas: 10000000,
        };

        log.info("[INVOKE_PARSEC_CONTRACTS] Request(" + invocationType + ") : " + JSON.stringify(invokeContractRequest));

        // process
        const invokeContractResponse = await parsecApi.invokeContractV1(invokeContractRequest);

        // response
        if (invokeContractResponse === undefined ||
            invokeContractResponse.data.success === false) {
            log.error("error when invoking smart contract");

            throw new Error("error when deploying smart contract");
        }
        else{
            log.info("[INVOKE_PARSEC_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
            return invokeContractResponse.data;
            // if(invocationType === "SEND"){
            //     log.info("[INVOKE_BESU_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
            //     return invokeContractResponse.data;
            // }
            // else{
            //     log.info("[INVOKE_BESU_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data.callOutput));
            //     return invokeContractResponse.data.callOutput;
            // }
        }
    }
}

