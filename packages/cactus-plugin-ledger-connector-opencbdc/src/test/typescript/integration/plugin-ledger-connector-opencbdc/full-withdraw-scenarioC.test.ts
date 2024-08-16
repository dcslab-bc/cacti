import "jest-extended";
import { v4 as uuidv4 } from "uuid";
import {
  IPluginLedgerConnectorOpenCBDCOptions,
  PluginLedgerConnectorOpenCBDC
} from "../../../../../../cactus-plugin-ledger-connector-opencbdc/src/main/typescript/plugin-ledger-connector-opencbdc";
import {
    LogLevelDesc,
  } from "@hyperledger/cactus-common";
import { PluginRegistry } from "@hyperledger/cactus-core";
import CryptoMaterial from "../../../../crypto-material/crypto-material.json";
import OpenCBDCMaterial from "../../../../opencbdc-material/opencbdc-material.json";

const connectorId = uuidv4();
const logLevel: LogLevelDesc = "INFO";

const initAmount = 1000;
const inputAmount = 100;
const expiration = 2147483648;
const preimage = "preimage6c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b";
const getBalanceRequest0: any = {address: 0};
const getBalanceRequest1: any = {address: 1};
const getBalanceRequest2: any = {address: 2};
const getBalanceRequest3: any = {address: 3};
let resBalance = undefined;
let res = undefined;

const testCase = "Test withdraw AtoZ";
describe(testCase, () => {
  test(testCase, async () => {
    const pluginRegistry = new PluginRegistry();
    const options: IPluginLedgerConnectorOpenCBDCOptions = {
        rpcApiHttpHost:  OpenCBDCMaterial.rpcApi.HttpHost.ip+":"+ OpenCBDCMaterial.rpcApi.HttpHost.port,
        rpcApiWsHost: OpenCBDCMaterial.rpcApi.WsHost.ip+":"+ OpenCBDCMaterial.rpcApi.WsHost.port,
        pluginRegistry: pluginRegistry,
        instanceId: CryptoMaterial.ledger.opencbdc.id,
    };

    const plugin = new PluginLedgerConnectorOpenCBDC(options);

    console.log("init");
    // 1. Init
    res = await plugin.init({isScenarioAB: 0});
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    const wallet0 = res.data.wallet0; // 고객B
    const wallet1 = res.data.wallet1; // BQ
    const wallet2 = res.data.wallet2; // HN
    const wallet3 = res.data.wallet3; // HTLC_MODULE

    console.log("getBalance");
    // 2. getBalance - BQ = initAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest1);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(initAmount);

    console.log("deposit");
    // 3. Deposit
    res = await plugin.deposit({
      contractAddress: wallet3,
      inputAmount: inputAmount,
      expiration: expiration,
      //hashLock: hashLock,
      senderAddress: wallet1,
      receiver: wallet2,
      fromWalletNum: 1,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    const HTLCId = res.data.HTLCId;
    const hashLock = res.data.hashLock;

    console.log("getSingleStatus");
    // 4. getSingleStatus
    res = await plugin.getSingleStatus({
        inputAmount: inputAmount,
        sender: wallet1,
        receiver: wallet2,
        hashLock: hashLock,
        expiration: expiration,
    });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(1);

    console.log("withdraw");
    // 5. withdraw
    res = await plugin.withdraw({
        secret: preimage,
        HTLCId: HTLCId,
        fromWalletNum: 1,
        toWalletNum: 2,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getSingleStatus");
    // 6. getSingleStatus
    res = await plugin.getSingleStatus({
      inputAmount: inputAmount,
      sender: wallet1,
      receiver: wallet2,
      hashLock: hashLock,
      expiration: expiration,
  });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(3);

    console.log("getSecret");
    // 7. getSecret
    const getSecretRequest: any = {
      HTLCId: HTLCId,
    }
    res = await plugin.getSecret(getSecretRequest);
    expect(res.status).toEqual(200);
    expect(res.data.secret).toEqual(preimage);
    const secret = res.data.secret;

    console.log("transfer");
    // 8. transfer
    res = await plugin.transfer({
      senderNum: 2,
      receiver: wallet0,
      receiverNum: 0,
      inputAmount: inputAmount,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getBalance");
    // 9. getBalance - 고객B = inputAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest0);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(inputAmount);

    console.log("getBalance");
    // 10. getBalance - HN
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest2);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(0);

    console.log("getBalance");
    // 11. getBalance - BQ = initAmount - inputAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest1);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(initAmount - inputAmount);
  });
});