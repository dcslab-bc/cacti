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

const initAmount = 100000000;
const inputAmount = 1000000;
const expiration = 2147483648;
const preimage = "preimage6c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b";
const hashLock = "0x3c335ba7f06a8b01d0596589f73c19069e21c81e5013b91f408165d1bf623d32";
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
    res = await plugin.init({isScenarioAB: 1});
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    const wallet0 = res.data.wallet0; // MintAddr
    const wallet1 = res.data.wallet1; // SenderAddr (BoA)
    const wallet2 = res.data.wallet2; // RecevierAddr (Hana)
    const wallet3 = res.data.wallet3; // HTLC_MODULE

    console.log("getBalance");
    // 2. getBalance - MintAddr = initAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest0);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(initAmount);

    console.log("transfer");
    // 3. transfer
    res = await plugin.transfer({
      senderNum: 0,
      receiver: wallet1,
      receiverNum: 1,
      inputAmount: inputAmount,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getBalance");
    // 4. getBalance - SenderAddr (BoA) = inputAmount
    resBalance= await plugin.getBalanceOpenCBDC(getBalanceRequest1);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(inputAmount);

    console.log("deposit");
    // 5. Deposit
    res = await plugin.deposit({
      contractAddress: wallet3,
      inputAmount: inputAmount,
      expiration: expiration,
      hashLock: hashLock,
      senderAddress: wallet1,
      receiver: wallet2,
      fromWalletNum: 1,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    const HTLCId = res.data.HTLCId;

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
    expect(res.data).toEqual(1);

    console.log("refund");
    // 7. refund
    res = await plugin.refund({
        HTLCId: HTLCId,
        fromWalletNum: 2,
        toWalletNum: 1,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getSingleStatus");
    // 8. getSingleStatus
    res = await plugin.getSingleStatus({
      inputAmount: inputAmount,
      sender: wallet1,
      receiver: wallet2,
      hashLock: hashLock,
      expiration: expiration,
  });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(2);

    console.log("getBalance");
    // 9. getBalance - RecevierAddr (Hana) = 0
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest2);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(0);

    console.log("getBalance");
    // 10. getBalance - SenderAddr (BoA) = inputAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest1);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(inputAmount);

    console.log("getBalance");
    // 11. getBalance - MintAddr = initAmount - inputAmount
    resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest0);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(initAmount - inputAmount);
  });
});