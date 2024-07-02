import axios from "axios";
import {
  EthContractInvocationType,
  InvokeContractV1Response,
  PluginLedgerConnectorBesu,
  RunTransactionResponse,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";
import HashTimeLockJSON from "../solidity/contracts/HashedTimeLockContract.json";

export class PluginHtlcOpenCBDC {

  public async deposit(newContractRequest: any,): Promise<any> {
    const result = await axios.post('http://147.46.240.229:8765/api/opencbdc/deposit',{
      signingCredential: newContractRequest.signingCredential,
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
  
  public async getSingleStatus(getSingleStatusRequest: any,): Promise<any> {
    const result = await axios.post('http://147.46.240.229:8765/api/opencbdc/getsinglestatus', {
      HTLCId: getSingleStatusRequest.HTLCId,
      signingCredential: getSingleStatusRequest.signingCredential,
      inputAmount: getSingleStatusRequest.inputAmount,
      receiver: getSingleStatusRequest.receiver,
      hashLock: getSingleStatusRequest.hashLock,
      expiration: getSingleStatusRequest.expiration,
    });

    return result;
  }

  public async withdraw(withdrawRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.229:8765/api/opencbdc/withdraw', {
      HTLCId: withdrawRequest.HTLCId,
      signingCredential: withdrawRequest.signingCredential,
    });

    return result;
  }

  public async refund(refundRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.229:8765/api/opencbdc/refund', {
      HTLCId: refundRequest.HTLCId,
      signingCredential: refundRequest.signingCredential,
    });

    return result;
  }

  public async getBalance(getBalanceRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.229:8765/api/opencbdc/getbalance', {
      address: getBalanceRequest.address,
    });
    
    return result;
  }
}
