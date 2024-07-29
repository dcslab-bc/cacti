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

const initAmount = 50;
const inputAmount = 10;
const outputAmount = 20;
const expiration = 2147483648;
const hashLock = "hashlock211aafdbf51011aadf4f9e73187ef464ac8515875f9898d8db3d06e4";
const preimage = "preimage6c58916ec258f246851bea091d14d4247a2fc3e18694461b1816e13b";

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
    res = await plugin.init({});
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    const wallet0 = res.data.wallet0; // SenderAddr (BoA)
    const wallet1 = res.data.wallet1; // RecevierAddr (Hana)
    const wallet2 = res.data.wallet2; // HTLC_MODULE

    console.log("deposit");
    // 2. Deposit
    res = await plugin.deposit({
      contractAddress: wallet2,
      inputAmount: inputAmount,
      outputAmount: outputAmount,
      expiration: expiration,
      hashLock: hashLock,
      receiver: wallet1,
      outputNetwork: "Besu",
      outputAddress: CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
      preimage: preimage,
      senderAddress: wallet0,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    expect(res.data.HTLCId).toEqual("htlcidb239c83a8ff069bd619c9b47c69471207e74ca9cf68cef274891f544f8");
    const HTLCId = res.data.HTLCId;

    console.log("getSingleStatus");
    // 3. getSingleStatus
    res = await plugin.getSingleStatus({
        HTLCId: HTLCId,
        inputAmount: inputAmount,
        receiver: wallet1,
        hashLock: hashLock,
        expiration: expiration,
    });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(1);

    console.log("withdraw");
    // 4. withdraw
    res = await plugin.withdraw({
        secret: hashLock,
        HTLCId: HTLCId,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getSingleStatus");
    // 5. getSingleStatus
    res = await plugin.getSingleStatus({
      HTLCId: HTLCId,
      inputAmount: inputAmount,
      receiver: wallet1,
      hashLock: hashLock,
      expiration: expiration,
    });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(3);

    console.log("getBalance");
    // 6. getBalance - RecevierAddr (Hana)
    const getBalanceRequest: any = {
      address: 1,
    }
    const resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(inputAmount);

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
      senderAddress: 1,
      receiver: wallet0,
      receiverNum: 0,
      inputAmount: inputAmount,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    console.log("getBalance");
    // 6. getBalance - SenderAddr (BoA)
    const getBalanceRequest2: any = {
      address: 0,
    }
    const resBalance2 = await plugin.getBalanceOpenCBDC(getBalanceRequest2);
    expect(resBalance2.status).toEqual(200);
     expect(resBalance2.data.balance).toEqual(initAmount);
  });
});