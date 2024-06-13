/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Logger,
    Checks,
    LogLevelDesc,
    LoggerProvider,
} from "@hyperledger/cactus-common";
import {
    DefaultApi as BesuApi,
    DeployContractSolidityBytecodeV1Request,
    InvokeContractV1Request,
    EthContractInvocationType,
    PluginFactoryLedgerConnector,
    PluginLedgerConnectorBesu,
    Web3SigningCredentialType,
    Web3TransactionReceipt,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";

import "dotenv/config";

import {
ApiServer,
AuthorizationProtocol,
ConfigService,
Configuration,
ICactusApiServerOptions,
} from "@hyperledger/cactus-cmd-api-server";

export class BesuUtil {

    // deploy besu contract
    public async deployBesuContracts(log: Logger, besuApi: BesuApi, keychainId: string, contractJson: any, address: string, privateKey: string, constructorArgs?: any[]): Promise<Web3TransactionReceipt> {

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
        log.debug("[DEPLOY_BESU_CONTRACTS] Request(SEND) : " + JSON.stringify(deployContractRequest));

        // process
        const deployContractResponse = await besuApi.deployContractSolBytecodeV1(deployContractRequest);

        // response
        if (deployContractResponse === undefined) {
            log.error("error when deploying smart contract");

            throw new Error("error when deploying smart contract");
        }
        else{
            log.debug("[DEPLOY_BESU_CONTRACTS] Response(SEND) : " + JSON.stringify(deployContractResponse.data.transactionReceipt));

            return deployContractResponse.data.transactionReceipt!;
        }
    }

    // invoke besu contract
    public async invokeBesuContracts(log: Logger, invocationType: EthContractInvocationType, besuApi: BesuApi, keychainId: string, contractName: string, contractAddress: string, methodName: string, address: string, privateKey: string, params?: any[]): Promise<any> {

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

        log.info("[INVOKE_BESU_CONTRACTS] Request(" + invocationType + ") : " + JSON.stringify(invokeContractRequest));

        // process
        const invokeContractResponse = await besuApi.invokeContractV1(invokeContractRequest);

        // response
        if (invokeContractResponse === undefined ||
            invokeContractResponse.data.success === false) {
            log.error("error when invoking smart contract");

            throw new Error("error when deploying smart contract");
        }
        else{
            log.info("[INVOKE_BESU_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
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

