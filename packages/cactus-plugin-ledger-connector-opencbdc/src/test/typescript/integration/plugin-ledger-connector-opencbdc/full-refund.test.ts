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

const inputAmount = 100;
const outputAmount = 10;
const expiration = 2147483648;
const id = "0x38e7a0f8929af36b5d5120edda5f86caa49fe2df4904cfa6eba6bf437d78aceb";
const hashLock = "0x3c335ba7f06a8b01d0596589f73c19069e21c81e5013b91f408165d1bf623d32";

let res = undefined;

const testCase = "Test AtoZ";
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

    
    // 1. Init
    res = await plugin.init({});
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);

    
    // 2. Deposit
    res = await plugin.deposit({
      contractAddress: "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0",
      inputAmount: inputAmount,
      outputAmount: outputAmount,
      expiration: expiration,
      hashLock: hashLock,
      receiver: CryptoMaterial.demoApps.scenarioAB.opencbdc.foreignInter.hana.address,
      outputNetwork: "Besu",
      outputAddress: CryptoMaterial.demoApps.scenarioAB.besu.localInter.boa.address,
      connectorId: connectorId,
      web3SigningCredential: {
        "ethAccount": CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address,
        "secret": CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.privateKey,
        "type":"PRIVATE_KEY_HEX"
      },
      keychainId: CryptoMaterial.keychains.opencbdc.id,
    });
    expect(res.status).toEqual(200);
    expect(res.data.success).toEqual(true);
    expect(res.data.HTLCId).toEqual('abcdefg');
    const HTLCId = res.data.HTLCId;

    
    // 3. getSingleStatus
    res = await plugin.getSingleStatus({
        id: id,
        web3SigningCredential: {
          "ethAccount":CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address,
          "secret":CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.privateKey,
          "type":"PRIVATE_KEY_HEX"
        },
        
        HTLCId: HTLCId,
        inputAmount: inputAmount,
        receiver: CryptoMaterial.demoApps.scenarioAB.opencbdc.foreignInter.hana.address,
        hashLock: hashLock,
        expiration: expiration,
        connectorId: connectorId,
        keychainId: CryptoMaterial.keychains.opencbdc.id,
    });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual(1);

    
    // 4. getSecret
    const getSecretRequest: any = {
        address: CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address,
    }
    res = await plugin.getSecret(getSecretRequest);
    expect(res.status).toEqual(200);
    expect(res.data.secret).toEqual(CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.privateKey);
    const secret = res.data.secret;


    // 5. refund
    res = await plugin.refund({
        id: id,
        secret: secret,
        web3SigningCredential: {
          "ethAccount":CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address,
          "secret":CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.privateKey,
          "type":"PRIVATE_KEY_HEX"
        },
        connectorId: connectorId,
        keychainId: CryptoMaterial.keychains.opencbdc.id,
        gas: 10,
        HTLCId: HTLCId,
      });
      expect(res.status).toEqual(200);
      expect(res.data.success).toEqual(true);


    // 6. getBalance
    const getBalanceRequest: any = {
      address: CryptoMaterial.demoApps.scenarioAB.opencbdc.boa.address
    }

    const resBalance = await plugin.getBalanceOpenCBDC(getBalanceRequest);
    expect(resBalance.status).toEqual(200);
    expect(resBalance.data.balance).toEqual(100000000);
  });
});