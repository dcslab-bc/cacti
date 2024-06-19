import "jest-extended";

import {
  PluginHtlcOpenCBDC
} from "../../../../../../cactus-plugin-htlc-eth-besu-erc20/src/main/typescript/plugin-htlc-opencbdc";


const testCase = "Test refund endpoint";
describe(testCase, () => {


  test(testCase, async () => {
    const plugin = new PluginHtlcOpenCBDC();
    const getBalanceRequest: any = {
      connectorId: '5010e6ea-9eae-4d62-a559-88031e070a83',
      keychainId: '1ba88d47-8b8d-4d1b-9c05-be9545552fb6',
      address: '0xab94eFe55d465a02c5a0a7ca4eD83E98EeddE5aE'
    }
    
    const resBalance = await plugin.refund(getBalanceRequest);
    console.log(resBalance);
    expect(resBalance.data).toEqual(66);
  });
});
