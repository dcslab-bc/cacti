import axios from "axios";
import {
  EthContractInvocationType,
  InvokeContractV1Response,
  PluginLedgerConnectorBesu,
  RunTransactionResponse,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";
import HashTimeLockJSON from "../solidity/contracts/HashedTimeLockContract.json";

export class PluginHtlcOpenCBDC {
    async withdraw(withdrawRequest: any): Promise<any> {
        const params = [withdrawRequest.id, withdrawRequest.secret];
      
        try {
          const res = await axios.post('http://147.46.240.226:8765/api/opencbdc/withdraw', {
            contractName: HashTimeLockJSON.contractName,
            keychainId: withdrawRequest.keychainId,
            signingCredential: withdrawRequest.web3SigningCredential,
            invocationType: EthContractInvocationType.Send,
            methodName: "withdraw",
            params,
            gas: 0
          });
          console.log("==========================");
          console.log("* Response Status: " + res.status + "(" + res.statusText + ")");
          console.log("\n* Request URL: " + res.config.url);
          console.log("\n* Request Data:");
          console.log(res.config.data);
          console.log("==========================");
      
          console.log(res.data);
      
          // Return a dummy InvokeContractV1Response
          return {
            success: true,
            data: res.data
          };
        } catch (error) {
          console.error(error);
      
          // Return a dummy error InvokeContractV1Response
          return {
            success: false,
            error: error.message
          };
        }
    }

    public async getSingleStatus(
        getSingleStatusRequest: any,
      ): Promise<any> {
        const result = await axios.post('http://147.46.240.226:8765/api/opencbdc/getsinglestatus', {
          HTLCId: getSingleStatusRequest.HTLCId,
          contractAddress: getSingleStatusRequest.contractAddress,
          keychainId: getSingleStatusRequest.keychainId,
          signingCredential: getSingleStatusRequest.web3SigningCredential,
          inputAmount: getSingleStatusRequest.inputAmount,
          receiver: getSingleStatusRequest.receiver,
          hashLock: getSingleStatusRequest.hashLock,
          expiration: getSingleStatusRequest.expiration,
        });
    
        return result;
      } 

      public async newContract(
        newContractRequest: any,
      ): Promise<any> {
        const result = await axios.post('http://147.46.240.226:8765/api/opencbdc/newcontract',{
          contractAddress: newContractRequest.contractAddress,
          keychainId: newContractRequest.keychainId,
          signingCredential: newContractRequest.web3SigningCredential,
          inputAmount: newContractRequest.inputAmount,
          outputAmount: newContractRequest.outputAmount,
          receiver: newContractRequest.receiver,
          expiration: newContractRequest.expiration,
          hashLock: newContractRequest.hashLock,
          outputNetwork: newContractRequest.outputNetwork,
          outputAddress: newContractRequest.outputAddress,
        });
    
        return result;
      }  
}
