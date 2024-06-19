import axios from "axios";
import {
  EthContractInvocationType,
  InvokeContractV1Response,
  PluginLedgerConnectorBesu,
  RunTransactionResponse,
} from "@hyperledger/cactus-plugin-ledger-connector-besu";
import HashTimeLockJSON from "../solidity/contracts/HashedTimeLockContract.json";

export class PluginHtlcOpenCBDC {


  public async withdraw(withdrawRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.226:8765/api/opencbdc/withdraw', {
      HTLCId: withdrawRequest.HTLCId,
      keychainId: withdrawRequest.keychainId,
      signingCredential: withdrawRequest.web3SigningCredential,
      connectorId: withdrawRequest.connectorId,
    });
    return result;
  }

  public async refund(refundRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.226:8765/api/opencbdc/refund', {
      HTLCId: refundRequest.HTLCId,
      keychainId: refundRequest.keychainId,
      signingCredential: refundRequest.web3SigningCredential,
      connectorId: refundRequest.connectorId,
    });
    return result;
  }

  public async getBalance(getBalanceRequest: any): Promise<any> {
    const result = await axios.post('http://147.46.240.226:8765/api/opencbdc/refund', {
      keychainId: getBalanceRequest.keychainId,
      connectorId: getBalanceRequest.connectorId,
      address: getBalanceRequest.address,
      //defaultBlock: getBalanceRequest.defaultBlock,
    });
    return result;
  }
}
