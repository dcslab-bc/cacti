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

import {
    DefaultApi as HtlcCoordinatorBesuApi,
    PluginFactoryHTLCCoordinatorBesu,
    IPluginHTLCCoordinatorBesuOptions,
    HtlcPackage,
    OwnHTLCRequest,
    CounterpartyHTLCRequest,
    WithdrawCounterpartyRequest,
} from "@hyperledger/cactus-plugin-htlc-coordinator-besu";

import "dotenv/config";
import wait from "waait";
import { encodeParameter } from "web3-eth-abi";
import { keccak256 } from "web3-utils";

import {
ApiServer,
AuthorizationProtocol,
ConfigService,
Configuration,
ICactusApiServerOptions,
} from "@hyperledger/cactus-cmd-api-server";

const retryCount = 5;
const waitTimeout = 3000;

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
        log.debug("[BESU_DEPLOY_CONTRACTS] Request(SEND) : " + JSON.stringify(deployContractRequest));

        // process
        const deployContractResponse = await besuApi.deployContractSolBytecodeV1(deployContractRequest);

        // response
        if (deployContractResponse === undefined) {
            log.error("error when deploying smart contract");

            throw new Error("error when deploying smart contract");
        }
        else{
            log.debug("[BESU_DEPLOY_CONTRACTS] Response(SEND) : " + JSON.stringify(deployContractResponse.data.transactionReceipt));

            return deployContractResponse.data.transactionReceipt!;
        }
    }

    // invoke besu contract
    public async invokeBesuContracts(log: Logger, invocationType: EthContractInvocationType, besuApi: BesuApi, keychainId: string, contractName: string, methodName: string, address?: string, privateKey?: string, params?: any[]): Promise<any> {

        // request
        const invokeContractRequest: InvokeContractV1Request = {
            keychainId: keychainId,
            contractName: contractName,
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

        log.debug("[BESU_INVOKE_CONTRACTS] Request(" + invocationType + ") : " + JSON.stringify(invokeContractRequest));

        // process
        const invokeContractResponse = await besuApi.invokeContractV1(invokeContractRequest);

        // response
        if (invokeContractResponse === undefined ||
            invokeContractResponse.data.success === false) {
            log.error("error when invoking smart contract");

            throw new Error("error when invoking smart contract");
        }
        else{
            log.debug("[BESU_INVOKE_CONTRACTS] Response(" + invocationType + ") : " + JSON.stringify(invokeContractResponse.data));
            return invokeContractResponse.data;
        }
    }

    // owm besu htlc
    public async ownBesuHtlc(log: Logger, 
                            besuApi: HtlcCoordinatorBesuApi, 
                            connectorInstanceId: string, 
                            keychainId: string, 
                            hashTimeLockAddress: string,
                            hashLock: string, 
                            inputAmount: number, 
                            outputAmount: number,
                            expiration: number,
                            cbdcTokenAddress: string,
                            senderAddress: string,
                            senderPrivateKey: string,
                            receiverAddress: string,
                            outputNetwork: string,
                            outputAdddress: string): Promise<any> {
        
        // request
        const ownHTLCRequest: OwnHTLCRequest = {
            htlcPackage: HtlcPackage.BesuErc20,
            connectorInstanceId,
            keychainId,
            constructorArgs: [hashTimeLockAddress],
            web3SigningCredential: {
                ethAccount: senderAddress,
                secret: senderPrivateKey,
                type: Web3SigningCredentialType.PrivateKeyHex,
            },
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            expiration,
            hashLock,
            tokenAddress: cbdcTokenAddress,
            receiver: receiverAddress,
            outputNetwork: outputNetwork,
            outputAddress: outputAdddress,
            gas: 10000000,
        };
        log.debug("[BESU_OWN_HTLC] Request : " + JSON.stringify(ownHTLCRequest));

        for(let i = 0; i < retryCount; i++) {
            try{

                // process
                const onwHTLCResponse = await besuApi.ownHtlcV1(ownHTLCRequest);
                

                // response
                if (onwHTLCResponse === undefined ||
                    onwHTLCResponse.data.success === false) {
                    log.error("error when own htlc");

                    throw new Error("error when own htlc");
                }
                else{
                    log.debug("[BESU_OWN_HTLC] Response : " + JSON.stringify(onwHTLCResponse.data));
                    return onwHTLCResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await wait(waitTimeout);
            }
        }
    }

    // Get single HTLC Status
    public async counterpartyBesuHtlc(log: Logger, 
        besuApi: HtlcCoordinatorBesuApi, 
        connectorInstanceId: string, 
        keychainId: string, 
        htlcId: string, 
        signerAddress?: string,
        signerPrivateKey?: string): Promise<any> {

        // request
        const counterpartyHTLCRequest: CounterpartyHTLCRequest = {
            htlcPackage: HtlcPackage.BesuErc20,
            connectorInstanceId,
            keychainId,
            htlcId,
            web3SigningCredential: {
                ethAccount: signerAddress!,
                secret: signerPrivateKey!,
                type: Web3SigningCredentialType.PrivateKeyHex,
            },
            gas: 10000000,
        };
        log.debug("[BESU_COUNTERPARTY_HTLC] Request : " + JSON.stringify(counterpartyHTLCRequest));

        for(let i = 0; i < retryCount; i++) {
            try{
                // process
                const counterpartyHTLCResponse = await besuApi.counterpartyHtlcV1(counterpartyHTLCRequest);

                // response
                if (counterpartyHTLCResponse === undefined ||
                    counterpartyHTLCResponse.data.success === false) {
                    log.error("error when counterparty htlc");

                    throw new Error("error when counterparty htlc");
                }
                else{
                    log.debug("[BESU_COUNTERPARTY_HTLC] Response : " + JSON.stringify(counterpartyHTLCResponse.data));
                    return counterpartyHTLCResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await wait(waitTimeout);
            }
        }
    }

    // withdraw htlc
    public async withdrawBesuCounterpary(log: Logger, 
        besuApi: HtlcCoordinatorBesuApi, 
        connectorInstanceId: string, 
        keychainId: string, 
        htlcId: string, 
        secret: string, 
        signerAddress?: string,
        signerPrivateKey?: string): Promise<any> {

        // request
        const withdrawCounterpartyRequest: WithdrawCounterpartyRequest = {
            htlcPackage: HtlcPackage.BesuErc20,
            connectorInstanceId,
            keychainId,
            web3SigningCredential: {
                ethAccount: signerAddress!,
                secret: signerPrivateKey!,
                type: Web3SigningCredentialType.PrivateKeyHex,
            },
            htlcId,
            secret,
            gas: 10000000,
        };
        log.debug("[BESU_WITHDRAW_COUNTERPARTY] Request : " + JSON.stringify(withdrawCounterpartyRequest));

        for(let i = 0; i < retryCount; i++) {
            try{
                // process
                const withdrawCounterpartyResponse = await besuApi.withdrawCounterpartyV1(withdrawCounterpartyRequest);

                // response
                if (withdrawCounterpartyResponse === undefined ||
                    withdrawCounterpartyResponse.data.success === false) {
                    log.error("error when withdraw counterparty");

                    throw new Error("error when withdraw counterparty");
                }
                else{
                    log.debug("[BESU_WITHDRAW_COUNTERPARTY] Response : " + JSON.stringify(withdrawCounterpartyResponse.data));
                    return withdrawCounterpartyResponse.data;
                }
            }
            catch (e) {
                // log.error(e);
                log.error("Retry request");
                await wait(waitTimeout);
            }
        }
    }
}

